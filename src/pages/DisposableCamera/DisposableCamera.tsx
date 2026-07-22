import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, ZapOff, SwitchCamera } from 'lucide-react';
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
  const [nativeZoom, setNativeZoom] = useState(false);
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

  // (Re)start the camera stream for the current facing. VIDEO ONLY — requesting
  // the mic up front makes getUserMedia fail whenever the mic is busy/partial,
  // which is why the camera "often didn't start". Audio is grabbed on-demand
  // only when recording a video (below).
  const startStream = useCallback(async (which: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: which } });
    } catch {
      // Some devices reject an unmet facingMode — retry with any camera.
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    streamRef.current = stream;
    const v = videoRef.current;
    if (v) {
      v.srcObject = stream;
      // autoPlay handles most cases; retry play() for the rest.
      v.play().catch(() => setTimeout(() => v.play().catch(() => {}), 150));
    }
  }, []);

  useEffect(() => {
    if (phase !== 'ready') return;
    let cancelled = false;
    startStream(facing)
      .then(() => { if (!cancelled) applyZoomToTrack(zoom); })
      .catch(() => { if (!cancelled) showToast('לא הצלחנו לפתוח את המצלמה'); });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [phase, facing, startStream]);

  // Zoom the real lens where the browser exposes it (getCapabilities().zoom);
  // otherwise fall back to a digital crop applied at capture. On many Androids
  // this drives the optical/native zoom; 0.5 works where the track reports a
  // sub-1 min (ultra-wide).
  const applyZoomToTrack = useCallback(async (value: number) => {
    const track = streamRef.current?.getVideoTracks()[0] as any;
    const caps = track?.getCapabilities?.();
    if (caps?.zoom && typeof caps.zoom.min === 'number') {
      const z = Math.min(caps.zoom.max, Math.max(caps.zoom.min, value));
      try {
        await track.applyConstraints({ advanced: [{ zoom: z }] });
        setNativeZoom(true);
        return;
      } catch { /* fall through to digital */ }
    }
    setNativeZoom(false);
  }, []);

  const handleZoom = (value: number) => {
    setZoom(value);
    applyZoomToTrack(value);
  };

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
      const blob = await renderFilmFrame(video, { maxWidth: 1280, zoom: nativeZoom ? 1 : zoom });
      if (flashMode && track) {
        try { await track.applyConstraints({ advanced: [{ torch: false } as any] }); } catch { /* ignore */ }
      }
      void uploadShot(blob, 'jpg', 'image/jpeg');
      if (remainingRef.current - 1 <= 0) setTimeout(() => remainingRef.current <= 0 && setPhase('empty'), 400);
    } catch {
      setRemaining((r) => r + 1);
      showToast('צילום נכשל, נסו שוב');
    }
  }, [uploadShot, flashMode, zoom, nativeZoom]);

  const startVideo = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream || remainingRef.current <= 0 || recording) return;
    const mime = pickVideoMime();
    const chunks: BlobPart[] = [];

    // The viewfinder is video-only for reliable startup; grab the mic just for
    // the clip so videos still have sound, then combine the tracks.
    let micTrack: MediaStreamTrack | undefined;
    try {
      const a = await navigator.mediaDevices.getUserMedia({ audio: true });
      micTrack = a.getAudioTracks()[0];
    } catch { /* record silent if mic denied */ }
    const recStream = new MediaStream([...stream.getVideoTracks(), ...(micTrack ? [micTrack] : [])]);

    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(recStream, { mimeType: mime });
    } catch {
      micTrack?.stop();
      showToast('הקלטת וידאו לא נתמכת במכשיר');
      return;
    }
    recorderRef.current = rec;
    const track = stream.getVideoTracks()[0] as any;
    // Flash on video = torch held on for the whole clip.
    if (flashMode && track) { track.applyConstraints({ advanced: [{ torch: true }] }).catch(() => {}); }
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      window.clearInterval(recTimerRef.current);
      micTrack?.stop();
      if (flashMode && track) { track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}); }
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
  }, [recording, uploadShot, flashMode]);

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
        autoPlay
        onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
        style={{ transform: `${facing === 'user' ? 'scaleX(-1) ' : ''}scale(${nativeZoom ? 1 : zoom})` }}
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
        {/* zoom pills — 0.5 · 1 · 2 */}
        <div className="flex justify-center items-center gap-2.5 mb-6" dir="ltr">
          {[0.5, 1, 2].map((z) => {
            const active = zoom === z;
            return (
              <button
                key={z}
                onClick={() => handleZoom(z)}
                className={`rounded-full font-bold transition-all flex items-center justify-center ${active ? 'bg-white/90 text-black w-9 h-9 text-[13px]' : 'bg-black/45 text-white/80 w-7 h-7 text-[11px]'}`}
              >
                {z === 1 ? '1×' : z}
              </button>
            );
          })}
        </div>

        {/* main row */}
        <div className="flex items-center justify-between px-8">
          {/* left: flash + film shot-counter */}
          <div className="flex flex-col items-center gap-3 w-16">
            <button onClick={() => setFlashMode((v) => !v)} aria-label="פלאש" className={`w-11 h-11 rounded-full flex items-center justify-center ${flashMode ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}>
              {flashMode ? <Zap size={20} className="fill-current" /> : <ZapOff size={20} />}
            </button>
            {/* Film counter — counts down the shots left, center bold */}
            <div className="bg-black/55 rounded-lg px-2 py-1 flex items-baseline justify-center" dir="ltr">
              <span className="text-white/35 text-xs w-5 text-center tabular-nums">{remaining + 1 <= (status?.shotLimit ?? 16) ? remaining + 1 : ''}</span>
              <span className="text-white text-lg font-bold w-7 text-center tabular-nums">{remaining}</span>
              <span className="text-white/35 text-xs w-5 text-center tabular-nums">{remaining - 1 >= 0 ? remaining - 1 : ''}</span>
            </div>
          </div>

          {/* center: shutter + mode toggle underneath */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => (mode === 'photo' ? takePhoto() : recording ? stopVideo() : startVideo())}
              aria-label="צילום"
              className="relative w-[74px] h-[74px] rounded-full active:scale-90 transition-transform"
            >
              {mode === 'video' && recording && (
                <svg className="absolute inset-0 w-[74px] h-[74px] -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                  <circle cx="40" cy="40" r="37" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray={2 * Math.PI * 37} strokeDashoffset={2 * Math.PI * 37 * (1 - recPct / 100)} strokeLinecap="round" />
                </svg>
              )}
              <span className="absolute inset-0 rounded-full border-4 border-white/80" />
              {mode === 'video' && recording ? (
                <span className="absolute inset-[23px] rounded-md bg-red-500" />
              ) : (
                <span className={`absolute inset-1.5 rounded-full ${mode === 'video' ? 'bg-red-500' : 'bg-white'}`} />
              )}
            </button>
            <div className="flex bg-black/40 rounded-full p-1 text-xs">
              <button onClick={() => !recording && setMode('photo')} className={`px-4 py-1 rounded-full font-bold transition-colors ${mode === 'photo' ? 'bg-white text-black' : 'text-white/70'}`}>תמונה</button>
              <button onClick={() => !recording && setMode('video')} className={`px-4 py-1 rounded-full font-bold transition-colors ${mode === 'video' ? 'bg-white text-black' : 'text-white/70'}`}>וידאו</button>
            </div>
          </div>

          {/* right: flip */}
          <div className="w-16 flex justify-center">
            <button onClick={flip} aria-label="החלפת מצלמה" className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center">
              <SwitchCamera size={20} />
            </button>
          </div>
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
