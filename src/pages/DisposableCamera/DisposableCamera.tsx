import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { disposableApi, type DisposableStatus } from '@/services/api/disposable.api';
import { renderFilmFrame } from './filmFilter';

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

type Phase = 'loading' | 'name' | 'ready' | 'disabled' | 'empty' | 'error';

export const DisposableCamera = () => {
  const { code = '' } = useParams<{ code: string }>();
  const deviceId = getDeviceId();

  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<DisposableStatus | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [name, setName] = useState(() => localStorage.getItem('mynight_guest_name') || '');
  const [flash, setFlash] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load event status.
  useEffect(() => {
    let cancelled = false;
    disposableApi
      .status(code, deviceId)
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

  // Start the camera once we're on the shooting screen.
  useEffect(() => {
    if (phase !== 'ready') return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError('לא הצלחנו לפתוח את המצלמה. אשרו הרשאת מצלמה ונסו שוב.');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [phase]);

  const shoot = useCallback(async () => {
    const video = videoRef.current;
    if (!video || shooting || remaining <= 0) return;
    setShooting(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 220);

    try {
      const blob = await renderFilmFrame(video, { maxWidth: 1280 });
      const fileName = `shot-${Date.now()}.jpg`;
      const presign = await disposableApi.presignedUrl(code, deviceId, fileName, 'image/jpeg');
      await disposableApi.uploadToS3(presign.data!.uploadUrl, blob);
      const done = await disposableApi.complete(code, deviceId, presign.data!.key, name || 'אורח', {
        size: blob.size,
        mimeType: 'image/jpeg',
      });
      const left = done.data!.remaining;
      setRemaining(left);
      if (left <= 0) setPhase('empty');
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || '';
      if (msg.includes('פילם')) setPhase('empty');
      else setError('הצילום לא נשלח, נסו שוב');
      setTimeout(() => setError(''), 2500);
    } finally {
      setShooting(false);
    }
  }, [code, deviceId, name, remaining, shooting]);

  // ---- Screens ----
  if (phase === 'loading') {
    return <Screen><p className="text-white/70">רק רגע…</p></Screen>;
  }
  if (phase === 'disabled') {
    return <Screen><h1 className="text-2xl font-bold mb-2">המצלמה סגורה</h1><p className="text-white/60">האירוע הזה לא הפעיל את המצלמה החד-פעמית.</p></Screen>;
  }
  if (phase === 'error') {
    return <Screen><h1 className="text-2xl font-bold mb-2">אופס</h1><p className="text-white/60">לא מצאנו את האירוע. בדקו את הקישור.</p></Screen>;
  }
  if (phase === 'name') {
    return (
      <Screen>
        <div className="w-full max-w-xs text-center">
          <div className="text-5xl mb-4">📷</div>
          <h1 className="text-3xl font-black mb-1">המצלמה של {status?.coupleName}</h1>
          <p className="text-white/60 mb-8">{status?.shotLimit} צילומים. בלי לראות, בלי לחזור אחורה — כמו פעם.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="איך קוראים לך?"
            className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-center text-lg outline-none focus:border-white/50 mb-4"
          />
          <button
            onClick={() => { if (name.trim()) { localStorage.setItem('mynight_guest_name', name.trim()); setPhase('ready'); } }}
            disabled={!name.trim()}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg disabled:opacity-40"
          >
            קדימה לצלם
          </button>
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

  // phase === 'ready' — viewfinder
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none" dir="rtl">
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

      {/* Shutter flash */}
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-90' : 'opacity-0'}`} />

      {/* Viewfinder frame lines */}
      <div className="absolute inset-6 border border-white/25 rounded-sm pointer-events-none" />
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <span className="text-white/80 text-xs tracking-widest" dir="ltr">MYNIGHT · SINGLE USE</span>
        <span className="text-red-500 text-xs animate-pulse" dir="ltr">● REC</span>
      </div>

      {/* Remaining counter — mechanical film-counter look */}
      <div className="absolute top-20 right-6 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 text-right pointer-events-none">
        <div className="text-[10px] text-white/50 leading-none mb-1">נותרו</div>
        <div className="text-3xl font-black text-white leading-none tabular-nums" dir="ltr">{remaining}</div>
      </div>

      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-sm px-4 py-2 rounded-full">{error}</div>
      )}

      {/* Shutter button */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center">
        <button
          onClick={shoot}
          disabled={shooting}
          aria-label="צילום"
          className="relative w-20 h-20 rounded-full active:scale-90 transition-transform"
        >
          <span className="absolute inset-0 rounded-full bg-white/30" />
          <span className={`absolute inset-2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] ${shooting ? 'scale-90' : ''} transition-transform`} />
        </button>
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
