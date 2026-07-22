import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { disposableApi, type DisposableStatus } from '@/services/api/disposable.api';
import { renderFilmFrame } from './filmFilter';

const MAX_VIDEO_MS = 8000;

// Stable per-device id so the shot limit follows the phone, not the session.
function getDeviceId(): string {
  const KEY = 'mynight_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

function pickVideoMime(): string {
  const types = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'video/webm';
}

type Phase = 'loading' | 'name' | 'ready' | 'disabled' | 'empty' | 'error';
type Mode = 'photo' | 'video';

export const DisposableCamera = () => {
  const { code = '' } = useParams<{ code: string }>();
  const deviceId = getDeviceId();

  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<DisposableStatus | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [name, setName] = useState(() => localStorage.getItem('mynight_guest_name') || '');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<Mode>('photo');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  // Flash fires only during a photo (like a real camera), not a constant torch.
  const [flashMode, setFlashMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recPct, setRecPct] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState('');

  const secondsLeft = Math.max(0, Math.ceil((MAX_VIDEO_MS / 1000) * (1 - recPct / 100)));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recTimerRef = useRef<number | undefined>(undefined);
  const remainingRef = useRef(0);
  remainingRef.current = remaining;

  const flashOnce = () => { setFlash(true); setTimeout(() => setFlash(false), 200); };
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  // Load event status.
  useEffect(() => {
    let cancelled = false;
    disposableApi.status(code, deviceId)
      .then((res) => {
        if (cancelled) return;
        const s = res.data!;
        setStatus(s);
        setRemaining(s.remaining);
        if (!s.enabled) setPhase('disabled');
        else if (s.remaining <= 0) setPhase('empty');
        else setPhase(localStorage.getItem('mynight_guest_name') ? 'ready' : 'name');
      })
      .catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [code, deviceId]);

  // (Re)start the camera stream for the current facing.
  const startStream = useCallback(async (which: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const constraints: MediaStreamConstraints = {
      video: { facingMode: { ideal: which }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: true,
    };
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      // Mic denied or unavailable — fall back to video only (photos still work).
      stream = await navigator.mediaDevices.getUserMedia({ video: constraints.video, audio: false });
    }
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (phase !== 'ready') return;
    let cancelled = false;
    startStream(facing).catch(() => { if (!cancelled) showToast('לא הצלחנו לפתוח את המצלמה'); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [phase, facing, startStream]);

  // Upload one captured shot in the background; refund the counter if it fails.
  const uploadShot = useCallback(async (blob: Blob, ext: string, mimeType: string) => {
    try {
      const fileName = `shot-${Date.now()}.${ext}`;
      const presign = await disposableApi.presignedUrl(code, deviceId, fileName, mimeType);
      await disposableApi.uploadToS3(presign.data!.uploadUrl, blob);
      await disposableApi.complete(code, deviceId, presign.data!.key, name || 'אורח', { size: blob.size, mimeType });
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || '';
      if (msg.includes('פילם')) { setRemaining(0); setPhase('empty'); return; }
      setRemaining((r) => r + 1); // refund
      showToast('צילום לא נשלח, נסו שוב');
    }
  }, [code, deviceId, name]);

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || remainingRef.current <= 0) return;
    flashOnce();
    setRemaining((r) => Math.max(0, r - 1)); // instant counter — capture never waits on network
    const track = streamRef.current?.getVideoTracks()[0];
    try {
      // Real flash: pulse the torch on just for the exposure, then off.
      if (flashMode && track) {
        try { await track.applyConstraints({ advanced: [{ torch: true } as any] }); await new Promise((r) => setTimeout(r, 120)); } catch { /* no torch */ }
      }
      const blob = await renderFilmFrame(video, { maxWidth: 1280, zoom });
      if (flashMode && track) {
        try { await track.applyConstraints({ advanced: [{ torch: false } as any] }); } catch { /* ignore */ }
      }
      void uploadShot(blob, 'jpg', 'image/jpeg');
      if (remainingRef.current - 1 <= 0) setTimeout(() => remainingRef.current <= 0 && setPhase('empty'), 400);
    } catch {
      setRemaining((r) => r + 1);
      showToast('צילום נכשל, נסו שוב');
    }
  }, [uploadShot, flashMode, zoom]);

  const startVideo = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || remainingRef.current <= 0 || recording) return;
    const mime = pickVideoMime();
    const chunks: BlobPart[] = [];
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      showToast('הקלטת וידאו לא נתמכת במכשיר');
      return;
    }
    recorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      window.clearInterval(recTimerRef.current);
      setRecording(false);
      setRecPct(0);
      const blob = new Blob(chunks, { type: mime });
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      setRemaining((r) => Math.max(0, r - 1));
      void uploadShot(blob, ext, blob.type || mime);
    };
    rec.start();
    setRecording(true);
    const started = Date.now();
    recTimerRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / MAX_VIDEO_MS) * 100);
      setRecPct(pct);
      if (pct >= 100) stopVideo();
    }, 60);
  }, [recording, uploadShot]);

  const stopVideo = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }, []);

  const flip = () => setFacing((f) => (f === 'environment' ? 'user' : 'environment'));

  // ---- Non-camera screens ----
  if (phase === 'loading') return <Screen><p className="text-white/70">רק רגע…</p></Screen>;
  if (phase === 'disabled') return <Screen><h1 className="text-2xl font-bold mb-2">המצלמה סגורה</h1><p className="text-white/60">האירוע הזה לא הפעיל את המצלמה החד-פעמית.</p></Screen>;
  if (phase === 'error') return <Screen><h1 className="text-2xl font-bold mb-2">אופס</h1><p className="text-white/60">לא מצאנו את האירוע. בדקו את הקישור.</p></Screen>;
  if (phase === 'name') {
    return (
      <Screen>
        <div className="w-full max-w-xs text-center">
          <div className="text-5xl mb-4">📷</div>
          <h1 className="text-3xl font-black mb-1">{status?.coupleName}</h1>
          <p className="text-white/60 mb-8">{status?.shotLimit} צילומים. בלי לראות, בלי לחזור אחורה — כמו פעם.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="איך קוראים לך?" className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-center text-lg outline-none focus:border-white/50 mb-4" />
          <button onClick={() => { if (name.trim()) { localStorage.setItem('mynight_guest_name', name.trim()); setPhase('ready'); } }} disabled={!name.trim()} className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg disabled:opacity-40">קדימה לצלם</button>
        </div>
      </Screen>
    );
  }
  if (phase === 'empty') {
    return (
      <Screen>
        <div className="text-center">
          <div className="text-6xl mb-4">🎞️</div>
          <h1 className="text-3xl font-black mb-2">אזל הפילם!</h1>
          <p className="text-white/60 max-w-xs">כל הצילומים שלך נשלחו לפיתוח. תראו אותם באלבום של {status?.coupleName} — יום אחרי החתונה 💛</p>
        </div>
      </Screen>
    );
  }

  const weddingDate = status?.weddingDate ? new Date(status.weddingDate) : null;
  const dateLabel = weddingDate
    ? `${String(weddingDate.getDate()).padStart(2, '0')}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getFullYear()).slice(2)}`
    : '';

  // ---- Viewfinder ----
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none" dir="rtl">
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
        style={{ transform: `${facing === 'user' ? 'scaleX(-1) ' : ''}scale(${zoom})` }}
      />
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-90' : 'opacity-0'}`} />

      {/* REC — top-left */}
      {recording && (
        <div className="absolute top-5 left-5 flex items-center gap-1.5 pointer-events-none" dir="ltr">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-xs font-bold tracking-wider">REC</span>
        </div>
      )}

      {/* Couple names + wedding date — top center */}
      <div className="absolute top-5 left-0 right-0 text-center pointer-events-none px-16">
        <div className="text-white font-bold text-lg leading-tight drop-shadow">{status?.coupleName}</div>
        {dateLabel && <div className="text-white/60 text-xs mt-0.5" dir="ltr">{dateLabel}</div>}
      </div>

      {/* Video countdown — large, center */}
      {mode === 'video' && recording && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-white text-6xl font-black tabular-nums drop-shadow-lg pointer-events-none" dir="ltr">
          0:{String(secondsLeft).padStart(2, '0')}
        </div>
      )}

      {toast && <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full">{toast}</div>}

      {/* Bottom control area on a dark gradient */}
      <div className="absolute bottom-0 left-0 right-0 pb-9 pt-16 bg-gradient-to-t from-black/85 to-transparent">
        {/* zoom pills */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${zoom === z ? 'bg-white/90 text-black scale-105' : 'bg-black/40 text-white/80'}`}
            >
              {z}×
            </button>
          ))}
        </div>

        {/* mode toggle */}
        <div className="flex justify-center mb-5">
          <div className="flex bg-black/40 rounded-full p-1 text-sm">
            <button onClick={() => !recording && setMode('photo')} className={`px-6 py-1.5 rounded-full font-bold transition-colors ${mode === 'photo' ? 'bg-white text-black' : 'text-white/70'}`}>תמונה</button>
            <button onClick={() => !recording && setMode('video')} className={`px-6 py-1.5 rounded-full font-bold transition-colors ${mode === 'video' ? 'bg-white text-black' : 'text-white/70'}`}>וידאו</button>
          </div>
        </div>

        {/* flash · shutter+counter · flip */}
        <div className="flex items-center justify-around px-10">
          <button onClick={() => setFlashMode((v) => !v)} aria-label="פלאש" className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${flashMode ? 'bg-yellow-400 text-black' : 'bg-white/15 text-white'}`}>⚡</button>

          <div className="relative flex flex-col items-center">
            <button
              onClick={() => (mode === 'photo' ? takePhoto() : recording ? stopVideo() : startVideo())}
              aria-label="צילום"
              className="relative w-[76px] h-[76px] rounded-full active:scale-90 transition-transform"
            >
              {mode === 'video' && recording && (
                <svg className="absolute inset-0 w-[76px] h-[76px] -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                  <circle cx="40" cy="40" r="37" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray={2 * Math.PI * 37} strokeDashoffset={2 * Math.PI * 37 * (1 - recPct / 100)} strokeLinecap="round" />
                </svg>
              )}
              <span className="absolute inset-0 rounded-full border-4 border-white/80" />
              {mode === 'video' && recording ? (
                <span className="absolute inset-[24px] rounded-md bg-red-500" />
              ) : (
                <span className={`absolute inset-1.5 rounded-full ${mode === 'video' ? 'bg-red-500' : 'bg-white'}`} />
              )}
            </button>
            {/* frame counter, film-style, under the shutter */}
            <div className="mt-1.5 text-white/90 text-[11px] font-mono tracking-tight tabular-nums" dir="ltr">
              {remaining} / {status?.shotLimit}
            </div>
          </div>

          <button onClick={flip} aria-label="החלפת מצלמה" className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center text-xl">🔄</button>
        </div>
      </div>
    </div>
  );
};

const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-neutral-950 text-white flex flex-col items-center justify-center px-6" dir="rtl">
    {children}
  </div>
);

export default DisposableCamera;
