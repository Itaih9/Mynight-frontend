import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, ZapOff, SwitchCamera, Trash2, Play, Download, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { disposableApi, type DisposableStatus, type DisposableShot } from '@/services/api/disposable.api';
import { API_BASE_URL } from '@/config/api';
import { renderFilmFrame, captureStill } from './filmFilter';

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

// In-app browsers (Instagram/Facebook/TikTok webviews) often cripple or fully
// block getUserMedia. Used to tailor the recovery help text.
const IN_APP_BROWSER = /instagram|fbav|fban|fbios|fb_iab|line\/|micromessenger|tiktok|snapchat/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
);

function pickVideoMime(): string {
  const types = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'video/webm';
}

type Phase = 'loading' | 'name' | 'ready' | 'disabled' | 'review' | 'done' | 'error';
type Mode = 'photo' | 'video';

export const DisposableCamera = () => {
  const { code = '' } = useParams<{ code: string }>();
  const deviceId = getDeviceId();

  const [phase, setPhase] = useState<Phase>('loading');
  const [status, setStatus] = useState<DisposableStatus | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [shots, setShots] = useState<DisposableShot[]>([]);
  const [preview, setPreview] = useState<DisposableShot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [finishing, setFinishing] = useState(false);
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
  const [fly, setFly] = useState<{ url: string; fromX: number; fromY: number; fromSize: number; toX: number; toY: number; toSize: number } | null>(null);
  const [camStuck, setCamStuck] = useState(false); // camera didn't produce a frame → offer recovery UI
  const [camError, setCamError] = useState<'denied' | 'busy' | 'notfound' | 'unsupported' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedToPhone, setSavedToPhone] = useState(false);

  const secondsLeft = Math.max(0, Math.ceil((MAX_VIDEO_MS / 1000) * (1 - recPct / 100)));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const historyBtnRef = useRef<HTMLButtonElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recTimerRef = useRef<number | undefined>(undefined);
  const remainingRef = useRef(0);
  remainingRef.current = remaining;
  // Live mirrors for event listeners that outlive a render.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const facingRef = useRef(facing);
  facingRef.current = facing;
  const recordingRef = useRef(recording);
  recordingRef.current = recording;
  // Camera-acquisition bookkeeping: the generation counter invalidates stale
  // getUserMedia requests (the classic "two requests race, the loser holds the
  // camera forever" bug), busyRetries drives quiet retries when another app
  // briefly holds the camera, and startStreamRef breaks the callback cycle for
  // the restart paths.
  const streamGenRef = useRef(0);
  const busyRetriesRef = useRef(0);
  const watchdogRef = useRef<number | undefined>(undefined);
  const startStreamRef = useRef<(which: 'environment' | 'user') => void>(() => {});

  const flashOnce = () => { setFlash(true); setTimeout(() => setFlash(false), 200); };
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  // Grab an instant poster (first/last frame) from the live preview so a video's
  // history thumbnail shows a real frame right away instead of a black <video>.
  // The preview draws the raw, un-zoomed frame — matching the recorded clip.
  const posterFromVideo = (v: HTMLVideoElement, opts: { mirror?: boolean; zoom?: number } = {}): string | null => {
    try {
      const vw = v.videoWidth, vh = v.videoHeight;
      if (!vw || !vh) return null;
      const zoom = Math.max(1, opts.zoom ?? 1);
      const sw = vw / zoom, sh = vh / zoom;
      const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
      const cw = 480;
      const ch = Math.max(1, Math.round((cw * sh) / sw));
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      const cx = c.getContext('2d');
      if (!cx) return null;
      if (opts.mirror) { cx.translate(cw, 0); cx.scale(-1, 1); }
      cx.drawImage(v, sx, sy, sw, sh, 0, 0, cw, ch);
      return c.toDataURL('image/jpeg', 0.72);
    } catch {
      return null;
    }
  };

  // Animate the just-captured photo shrinking from the viewfinder into the
  // history thumbnail (bottom-left), so the guest sees where their shot "went".
  const flyToHistory = (url: string) => {
    const vf = videoRef.current?.getBoundingClientRect();
    const target = historyBtnRef.current?.getBoundingClientRect();
    if (!vf || !target) return;
    setFly({
      url,
      fromX: vf.left + vf.width / 2,
      fromY: vf.top + vf.height / 2,
      fromSize: Math.min(vf.width, vf.height) * 0.55,
      toX: target.left + target.width / 2,
      toY: target.top + target.height / 2,
      toSize: target.width || 48,
    });
  };

  // Manual download of one shot to the phone (no auto-save). Uses the backend
  // download endpoint, which streams the file with Content-Disposition: attachment
  // so the browser saves it instead of navigating.
  const downloadShot = (shot: DisposableShot) => {
    const a = document.createElement('a');
    a.href = `${API_BASE_URL}/api/photos/download/${shot._id}`;
    a.download = '';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const stopStream = useCallback(() => {
    streamGenRef.current += 1; // invalidate any in-flight getUserMedia
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

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
        // Re-entry with no film left: straight to the thank-you — a returning guest
        // must NOT see their old shots ("dont show recents"). The review gallery is
        // only reached in-session, from the shots just taken.
        else if (s.remaining <= 0) setPhase('done');
        else setPhase(localStorage.getItem('mynight_guest_name') ? 'ready' : 'name');
      })
      .catch(() => { if (!cancelled) setPhase('error'); });
    return () => { cancelled = true; };
  }, [code, deviceId]);

  // The review gallery shows only the shots taken THIS session (already in
  // `shots`) so a returning guest never sees old recents. Just release the camera.
  useEffect(() => {
    if (phase !== 'review') return;
    stopStream();
  }, [phase, stopStream]);

  // Arm (or re-arm) the no-frame watchdog: if the preview still has no pixels
  // after a few seconds — denied permission, hung getUserMedia, black stream —
  // surface the recovery UI. Harmless when the camera is fine (videoWidth > 0),
  // and onPlaying clears the flag the moment a real frame arrives.
  const armWatchdog = useCallback(() => {
    window.clearTimeout(watchdogRef.current);
    watchdogRef.current = window.setTimeout(() => {
      if (phaseRef.current === 'ready' && (videoRef.current?.videoWidth ?? 0) === 0) setCamStuck(true);
    }, 4000);
  }, []);

  // (Re)start the camera stream for the current facing. VIDEO ONLY — requesting
  // the mic up front makes getUserMedia fail whenever the mic is busy/partial.
  // Audio is grabbed on-demand only when recording a video (below).
  //
  // Hardened against every "camera won't start" mode we've hit:
  //  • two requests racing (fast flip / re-entry): the loser used to resolve
  //    late and HOLD the camera, so nothing worked until a reload. A generation
  //    counter now stops stale streams the moment they arrive.
  //  • permission denied / camera held by another app / no camera / webview
  //    without mediaDevices: classified into camError for a targeted fix hint.
  //  • camera reclaimed by the OS (lock screen, call): track.onended restarts.
  const startStream = useCallback(async (which: 'environment' | 'user') => {
    const gen = ++streamGenRef.current;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      // In-app browsers / insecure contexts have no mediaDevices at all —
      // retrying can't help, guide the guest out to a real browser instead.
      setCamError('unsupported');
      setCamStuck(true);
      return;
    }

    // High resolution first (a bare request gives 640×480 on many phones).
    // `ideal` shouldn't hard-fail, but keep a fallback chain for odd devices.
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: which }, width: { ideal: 2560 }, height: { ideal: 1440 } } },
      { video: { facingMode: { ideal: which } } },
      { video: true },
    ];
    let lastErr: any = null;
    let stream: MediaStream | null = null;
    for (const constraints of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (e: any) {
        lastErr = e;
        if (gen !== streamGenRef.current) return; // superseded meanwhile
        const n = e?.name || '';
        // Denied is denied — other constraints won't change the answer.
        if (n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError') break;
      }
    }

    if (!stream) {
      const n = lastErr?.name || '';
      const busy = n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError';
      if (busy && busyRetriesRef.current < 2) {
        // Another app/tab is releasing the camera — retry quietly first.
        busyRetriesRef.current += 1;
        window.setTimeout(() => { if (gen === streamGenRef.current) startStreamRef.current(which); }, 900);
        return;
      }
      setCamError(
        n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError' ? 'denied'
          : busy ? 'busy'
          : n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError' ? 'notfound'
          : null
      );
      setCamStuck(true);
      return;
    }

    if (gen !== streamGenRef.current) {
      // A newer request won while this one was pending (or we left the camera).
      // Release immediately — a leaked stream is what used to block the camera.
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    busyRetriesRef.current = 0;
    // Continuous autofocus — best effort. Some devices don't report focusMode in
    // getCapabilities yet still honour the constraint, so just try and ignore.
    try {
      await (stream.getVideoTracks()[0] as any).applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch { /* focus not controllable — ignore */ }
    // If the OS reclaims the camera (lock screen, phone call, another app),
    // restart as soon as we're visible in the viewfinder again.
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.onended = () => {
        if (streamRef.current !== stream || recordingRef.current) return;
        if (document.visibilityState === 'visible' && phaseRef.current === 'ready') {
          armWatchdog();
          startStreamRef.current(facingRef.current);
        }
      };
    }
    const v = videoRef.current;
    if (v) {
      v.srcObject = stream;
      // autoPlay handles most cases; retry play() for the rest.
      v.play().catch(() => setTimeout(() => v.play().catch(() => {}), 150));
    }
  }, [armWatchdog]);
  startStreamRef.current = startStream;

  useEffect(() => {
    if (phase !== 'ready') return;
    setCamStuck(false);
    setCamError(null);
    busyRetriesRef.current = 0;
    armWatchdog();
    startStream(facing);
    return () => {
      window.clearTimeout(watchdogRef.current);
      streamGenRef.current += 1; // invalidate any in-flight request
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, facing, startStream]);

  // Coming back from the lock screen / app switcher: iOS and some Androids
  // freeze or kill the stream — revive it the moment we're visible again.
  useEffect(() => {
    const revive = () => {
      if (document.visibilityState !== 'visible') return;
      if (phaseRef.current !== 'ready' || recordingRef.current) return;
      const track = streamRef.current?.getVideoTracks()[0];
      const v = videoRef.current;
      if (!track || track.readyState === 'ended' || !v || v.videoWidth === 0) {
        armWatchdog();
        startStreamRef.current(facingRef.current);
      } else if (v.paused) {
        v.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', revive);
    window.addEventListener('pageshow', revive);
    window.addEventListener('focus', revive);
    return () => {
      document.removeEventListener('visibilitychange', revive);
      window.removeEventListener('pageshow', revive);
      window.removeEventListener('focus', revive);
    };
  }, [armWatchdog]);

  // Manual recovery — runs inside a user gesture, which also satisfies browsers
  // that refuse to open the camera without one (the classic silent re-entry bug).
  const retryCamera = () => {
    busyRetriesRef.current = 0;
    setCamStuck(false);
    setCamError(null);
    armWatchdog();
    startStream(facing);
  };

  // For the "wrong browser" case — let the guest carry the link to Chrome/Safari.
  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('הקישור הועתק — הדביקו בדפדפן');
    } catch {
      showToast(window.location.href);
    }
  };

  // Digital zoom only. Native lens zoom (applyConstraints({zoom})) is exposed on
  // some Androids but many accept the constraint without moving the lens — so it
  // silently "does nothing". A center-crop is 100% reliable: the preview scales
  // and renderFilmFrame crops the actual captured frame to match.
  const handleZoom = (value: number) => {
    setZoom(value);
  };

  // Upload one captured shot in the background. The shot is already shown
  // optimistically (local blob URL, id `tempId`); here we swap it for the real
  // server photo on success, or drop it on failure.
  const uploadShot = useCallback(async (blob: Blob, ext: string, mimeType: string, tempId: string, localUrl: string) => {
    try {
      const fileName = `shot-${Date.now()}.${ext}`;
      const presign = await disposableApi.presignedUrl(code, deviceId, fileName, mimeType);
      await disposableApi.uploadToS3(presign.data!.uploadUrl, blob);
      const res = await disposableApi.complete(code, deviceId, presign.data!.key, name || 'אורח', { size: blob.size, mimeType });
      const done = res.data!;
      // Keep the instant local poster for videos — the server's /thumbnails/ copy
      // is generated async by Lambda and may 404 (black) for a while.
      setShots((s) => s.map((x) => {
        if (x._id !== tempId) return x;
        const keepThumb = x.thumbnailUrl.startsWith('data:') ? x.thumbnailUrl : done.photo.thumbnailUrl;
        return { ...done.photo, thumbnailUrl: keepThumb };
      }));
      setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
      setRemaining(done.remaining);
      if (done.remaining <= 0) setPhase('review');
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || '';
      setShots((s) => s.filter((x) => x._id !== tempId)); // drop the failed optimistic shot
      URL.revokeObjectURL(localUrl);
      if (msg.includes('פילם')) { setRemaining(0); setPhase('review'); return; }
      setRemaining((r) => r + 1); // refund
      setFinishing(false);
      showToast('צילום לא נשלח, נסו שוב');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, deviceId, name]);

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || remainingRef.current <= 0) return;
    flashOnce();
    if (remainingRef.current <= 1) setFinishing(true); // last frame — "developing…"
    setRemaining((r) => Math.max(0, r - 1)); // instant counter — capture never waits on network
    const mirror = facing === 'user'; // mirror selfies (matches the preview)
    const tempId = `tmp-${Date.now()}`;

    // Fire the shot INSTANTLY: a quick low-res poster off the live preview drives
    // the history thumbnail and the fly animation right now — the full-res render
    // below can take ~1s and we don't want the animation waiting on it.
    const quick = posterFromVideo(video, { mirror, zoom });
    if (quick) {
      setShots((s) => [...s, { _id: tempId, url: quick, thumbnailUrl: quick, type: 'photo' }]);
      flyToHistory(quick);
    }

    const track = streamRef.current?.getVideoTracks()[0];
    try {
      // Real flash: pulse the torch on just for the exposure, then off.
      if (flashMode && track) {
        try { await track.applyConstraints({ advanced: [{ torch: true } as any] }); await new Promise((r) => setTimeout(r, 120)); } catch { /* no torch */ }
      }
      // Highest quality: a full-resolution ImageCapture still where supported
      // (Android → sensor photo res), else the video frame (iOS/Safari). Full res,
      // downscaled with high-quality resampling only past the 4096 canvas ceiling.
      const still = track ? await captureStill(track) : null;
      const blob = await renderFilmFrame(still ?? video, { maxWidth: 4096, dateStamp: false, zoom, mirror });
      still?.close();
      if (flashMode && track) {
        try { await track.applyConstraints({ advanced: [{ torch: false } as any] }); } catch { /* ignore */ }
      }
      const localUrl = URL.createObjectURL(blob);
      if (quick) {
        // Upgrade the placeholder's full-quality source; keep the data: thumbnail.
        setShots((s) => s.map((x) => (x._id === tempId ? { ...x, url: localUrl } : x)));
      } else {
        setShots((s) => [...s, { _id: tempId, url: localUrl, thumbnailUrl: localUrl, type: 'photo' }]);
        flyToHistory(localUrl);
      }
      void uploadShot(blob, 'jpg', 'image/jpeg', tempId, localUrl);
    } catch {
      setShots((s) => s.filter((x) => x._id !== tempId)); // drop the placeholder
      setRemaining((r) => r + 1);
      setFinishing(false);
      showToast('צילום נכשל, נסו שוב');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadShot, flashMode, zoom, facing]);

  const stopVideo = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }, []);

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
    // Front camera: record from a mirrored canvas so the selfie clip matches the
    // (mirrored) preview instead of coming out reversed. Back camera records the
    // raw track directly. Falls back to raw if canvas capture isn't available.
    const mirror = facing === 'user';
    let videoTracks = stream.getVideoTracks();
    let mirrorRaf = 0;
    let mirrorCanvasTrack: MediaStreamTrack | undefined;
    const src = videoRef.current;
    if (mirror && src) {
      try {
        const vw = src.videoWidth || 1280;
        const vh = src.videoHeight || 720;
        const cw = Math.min(1440, vw);
        const ch = Math.round((cw * vh) / vw);
        const cvs = document.createElement('canvas');
        cvs.width = cw;
        cvs.height = ch;
        const cctx = cvs.getContext('2d')!;
        const drawFrame = () => {
          cctx.save();
          cctx.translate(cw, 0);
          cctx.scale(-1, 1);
          cctx.drawImage(src, 0, 0, cw, ch);
          cctx.restore();
          mirrorRaf = requestAnimationFrame(drawFrame);
        };
        drawFrame();
        const cstream = (cvs as any).captureStream?.(30) as MediaStream | undefined;
        if (cstream?.getVideoTracks().length) {
          mirrorCanvasTrack = cstream.getVideoTracks()[0];
          videoTracks = cstream.getVideoTracks();
        } else if (mirrorRaf) {
          cancelAnimationFrame(mirrorRaf);
          mirrorRaf = 0;
        }
      } catch {
        if (mirrorRaf) { cancelAnimationFrame(mirrorRaf); mirrorRaf = 0; }
      }
    }
    const recStream = new MediaStream([...videoTracks, ...(micTrack ? [micTrack] : [])]);

    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(recStream, { mimeType: mime });
    } catch {
      micTrack?.stop();
      if (mirrorRaf) cancelAnimationFrame(mirrorRaf);
      mirrorCanvasTrack?.stop();
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
      if (mirrorRaf) cancelAnimationFrame(mirrorRaf);
      mirrorCanvasTrack?.stop();
      micTrack?.stop();
      if (flashMode && track) { track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}); }
      setRecording(false);
      setRecPct(0);
      const blob = new Blob(chunks, { type: mime });
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      if (remainingRef.current <= 1) setFinishing(true);
      setRemaining((r) => Math.max(0, r - 1));
      const tempId = `tmp-${Date.now()}`;
      const localUrl = URL.createObjectURL(blob);
      const poster = videoRef.current ? posterFromVideo(videoRef.current, { mirror }) : null;
      setShots((s) => [...s, { _id: tempId, url: localUrl, thumbnailUrl: poster || localUrl, type: 'video' }]);
      // Only fly a video if we have an instant poster — never a black square.
      if (poster) flyToHistory(poster);
      void uploadShot(blob, ext, blob.type || mime, tempId, localUrl);
    };
    rec.start();
    setRecording(true);
    const started = Date.now();
    recTimerRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / MAX_VIDEO_MS) * 100);
      setRecPct(pct);
      if (pct >= 100) stopVideo();
    }, 60);
  }, [recording, uploadShot, flashMode, stopVideo, facing]);

  const flip = () => {
    setZoom(1);
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'));
  };

  // Swipe up/down anywhere on the viewfinder to flip the camera.
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const onViewfinderTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY };
  };
  const onViewfinderTouchEnd = (e: React.TouchEvent) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || recording) return; // don't switch mid-recording
    const t = e.changedTouches[0];
    const dy = t.clientY - s.y;
    const dx = t.clientX - s.x;
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) * 1.5) flip();
  };

  // Swipe left/right in the enlarged gallery to move between shots.
  const gallerySwipeRef = useRef<{ x: number; y: number } | null>(null);
  const onGalleryTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    gallerySwipeRef.current = { x: t.clientX, y: t.clientY };
  };
  const onGalleryTouchEnd = (e: React.TouchEvent) => {
    const s = gallerySwipeRef.current;
    gallerySwipeRef.current = null;
    if (!s || !preview) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    const idx = shots.findIndex((x) => x._id === preview._id);
    if (idx === -1) return;
    const next = dx < 0 ? idx + 1 : idx - 1; // swipe left → newer, right → older
    if (next >= 0 && next < shots.length) setPreview(shots[next]);
  };

  const deleteShot = async (shot: DisposableShot) => {
    setDeleting(true);
    try {
      await disposableApi.remove(code, deviceId, shot._id);
      setShots((s) => s.filter((x) => x._id !== shot._id)); // note: shot stays spent, remaining unchanged
      setPreview(null);
    } catch {
      showToast('מחיקה נכשלה');
    } finally {
      setDeleting(false);
    }
  };

  const fireConfetti = () => {
    const colors = ['#f5c518', '#ffffff', '#ffb454', '#ffd700'];
    confetti({ particleCount: 50, spread: 70, startVelocity: 38, origin: { y: 0.65 }, colors });
  };

  // Save every shot to the phone once the guest finishes — one staggered pass so
  // the browser's "allow multiple downloads" gate fires once, not per file.
  // Uploaded shots download the full-res file from the server; any still-uploading
  // one falls back to its local blob so nothing is missed.
  const downloadAllShots = () => {
    shots.forEach((shot, i) => {
      window.setTimeout(() => {
        try {
          const a = document.createElement('a');
          a.href = shot._id.startsWith('tmp-') ? shot.url : `${API_BASE_URL}/api/photos/download/${shot._id}`;
          a.download = `mynight-${i + 1}.${shot.type === 'video' ? 'mp4' : 'jpg'}`;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch { /* skip this one */ }
      }, i * 400);
    });
  };

  const finishRoll = () => {
    if (shots.length) { setSavedToPhone(true); downloadAllShots(); }
    stopStream();
    setPhase('done');
    setTimeout(fireConfetti, 120);
  };

  const weddingDate = status?.weddingDate ? new Date(status.weddingDate) : null;
  const dateLabel = weddingDate
    ? `${String(weddingDate.getDate()).padStart(2, '0')}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getFullYear()).slice(2)}`
    : '';

  // Enlarged shot with a (non-refunding) delete — shared by the strip and review.
  const previewOverlay = preview && (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" dir="rtl">
      <div
        onTouchStart={onGalleryTouchStart}
        onTouchEnd={onGalleryTouchEnd}
        className="flex-1 flex items-center justify-center p-4 min-h-0 relative"
      >
        {preview.type === 'video' ? (
          <video key={preview._id} src={preview.url} controls autoPlay playsInline className="max-w-full max-h-full rounded-2xl" />
        ) : (
          <img key={preview._id} src={preview.url} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        )}
        {shots.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/55 text-white/80 text-xs px-3 py-1 rounded-full tabular-nums" dir="ltr">
            {shots.findIndex((x) => x._id === preview._id) + 1} / {shots.length}
          </div>
        )}
      </div>
      <div className="px-6 pb-8 pt-2">
        <button onClick={() => downloadShot(preview)} className="w-full py-3.5 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 mb-3 active:scale-[0.99] transition-transform">
          <Download size={18} /> הורדה לטלפון
        </button>
        <p className="text-center text-white/40 text-xs mb-3">מחיקה מסירה את הצילום — אבל לא מחזירה לך צילום</p>
        <div className="flex gap-3">
          <button onClick={() => setPreview(null)} className="flex-1 py-3.5 rounded-2xl bg-white/10 text-white font-bold">חזרה</button>
          <button onClick={() => deleteShot(preview)} disabled={deleting} className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Trash2 size={18} /> {deleting ? 'מוחק…' : 'מחיקה'}
          </button>
        </div>
      </div>
    </div>
  );

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

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-white flex flex-col items-center px-6" dir="rtl">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs">
          <div className="text-6xl mb-5">💛</div>
          <p className="text-white/85 text-lg leading-relaxed mb-4">תודה שצילמתם! 🎞️ כל רגע שתפסתם עכשיו שמור — חלק מהסיפור של הערב הזה.</p>
          {savedToPhone && <p className="text-white/50 text-sm mb-6">📲 הצילומים נשמרים גם בטלפון שלך</p>}
          {/* CTA to the site — left-pointing arrow sits to the LEFT of the label */}
          <a href="/" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-bold text-lg active:scale-95 transition-transform">
            <span>לאתר</span>
            <ArrowLeft size={20} />
          </a>
        </div>
        <div className="pb-10 font-rouge text-white text-6xl" dir="ltr">mynight.co.il</div>
      </div>
    );
  }

  // ---- Review gallery (roll ran out) ----
  if (phase === 'review') {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-white flex flex-col" dir="rtl">
        <header className="px-5 pt-7 pb-3 text-center shrink-0">
          <div className="text-4xl mb-1">🎞️</div>
          <h1 className="text-2xl font-black mb-1">הפילם נגמר!</h1>
          <p className="text-white/55 text-sm">{shots.length} צילומים בדרך לאלבום של {status?.coupleName}. אפשר למחוק מה שלא יצא — אבל זה לא יחזיר צילומים.</p>
        </header>

        <div className="flex-1 overflow-y-auto px-3 pb-4 min-h-0">
          {shots.length === 0 ? (
            <p className="text-center text-white/40 mt-16">אין צילומים להצגה.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {shots.map((shot) => (
                <button key={shot._id} onClick={() => setPreview(shot)} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 active:opacity-70">
                  <ShotMedia shot={shot} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="px-5 pt-3 pb-7 shrink-0 border-t border-white/10">
          <button onClick={finishRoll} className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg active:scale-[0.99] transition-transform">סיום ✓</button>
        </footer>

        {previewOverlay}
      </div>
    );
  }

  // ---- Viewfinder ----
  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none flex flex-col" dir="rtl">
      {/* Flash — icon only, top-left of the screen */}
      <button onClick={() => setFlashMode((v) => !v)} aria-label="פלאש" className="absolute top-3 left-4 z-30 p-1 active:scale-90 transition-transform">
        {flashMode ? <Zap size={24} className="fill-yellow-400 text-yellow-400" /> : <ZapOff size={24} className="text-white/80" />}
      </button>

      {/* Top bar: date above the couple names (on the black frame) */}
      <div className="shrink-0 pt-3 pb-2 px-5 text-center">
        {dateLabel && <div className="text-white/45 text-[11px] mb-0.5" dir="ltr">{dateLabel}</div>}
        <div className="text-white font-bold text-base leading-tight">{status?.coupleName}</div>
      </div>

      {/* The viewfinder — a window inside the black body. It FILLS the free space
          (no fixed aspect) so the names on top and the controls below are never
          pushed off-screen. transform-gpu forces the scaled (zoomed) video to clip
          inside the rounded window; touch-none stops the browser page-zoom gesture. */}
      <div className="flex-1 relative min-h-0">
        <div
          onTouchStart={onViewfinderTouchStart}
          onTouchEnd={onViewfinderTouchEnd}
          className="absolute inset-x-3 top-1 bottom-1 rounded-[26px] overflow-hidden bg-neutral-900 ring-1 ring-white/15 shadow-[0_0_0_3px_rgba(0,0,0,0.6),0_20px_50px_rgba(0,0,0,0.6)] transform-gpu touch-none"
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
            onPlaying={() => { setCamStuck(false); setCamError(null); }}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
            style={{ transform: `${facing === 'user' ? 'scaleX(-1) ' : ''}scale(${zoom})`, transformOrigin: 'center' }}
          />
          <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-90' : 'opacity-0'}`} />

          {/* corner brackets — that "looking through the finder" feel */}
          <Corner className="top-3 left-3 border-t-2 border-l-2" />
          <Corner className="top-3 right-3 border-t-2 border-r-2" />
          <Corner className="bottom-3 left-3 border-b-2 border-l-2" />
          <Corner className="bottom-3 right-3 border-b-2 border-r-2" />

          {/* REC — top-left inside the window */}
          {recording && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 pointer-events-none" dir="ltr">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-xs font-bold tracking-wider">REC</span>
            </div>
          )}

          {/* Animated film counter — bottom-left, just above & right of the corner mark */}
          <div className="absolute bottom-8 left-8">
            <FilmCounter value={remaining} />
          </div>

          {/* Video countdown — small, top center */}
          {recording && (
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 bg-black/55 text-white text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-full pointer-events-none" dir="ltr">
              0:{String(secondsLeft).padStart(2, '0')}
            </div>
          )}

          {/* Developing overlay — last frame is uploading */}
          {finishing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <p className="text-white/80 text-sm">מפתח את הצילומים</p>
            </div>
          )}

          {/* Camera didn't start — say why, and always give a way back in */}
          {camStuck && (
            <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-3 backdrop-blur-sm px-8 text-center">
              <p className="text-white font-bold">
                {camError === 'denied' ? 'צריך הרשאה למצלמה'
                  : camError === 'busy' ? 'המצלמה תפוסה'
                  : camError === 'notfound' ? 'לא נמצאה מצלמה'
                  : camError === 'unsupported' ? 'הדפדפן חוסם את המצלמה'
                  : 'לא הצלחנו להפעיל את המצלמה'}
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                {camError === 'denied' ? 'אפשרו גישה למצלמה בהגדרות האתר בדפדפן (סמל המנעול ליד הכתובת) ונסו שוב.'
                  : camError === 'busy' ? 'נראה שאפליקציה אחרת משתמשת במצלמה. סגרו אותה ונסו שוב.'
                  : camError === 'unsupported' ? 'פתחו את הקישור ב-Chrome או Safari כדי לצלם.'
                  : IN_APP_BROWSER ? 'נפתח דרך אפליקציה? עדיף לפתוח את הקישור בדפדפן (Chrome / Safari).'
                  : 'לחצו להפעלה מחדש של המצלמה.'}
              </p>
              {camError === 'unsupported' ? (
                <button onClick={copyPageLink} className="px-6 py-3 rounded-full bg-white text-black font-bold active:scale-95 transition-transform">העתקת הקישור</button>
              ) : (
                <button onClick={retryCamera} className="px-6 py-3 rounded-full bg-white text-black font-bold active:scale-95 transition-transform">הפעלת המצלמה</button>
              )}
              {IN_APP_BROWSER && camError !== 'unsupported' && (
                <button onClick={copyPageLink} className="text-white/60 text-xs underline">העתקת הקישור לפתיחה בדפדפן</button>
              )}
            </div>
          )}

          {toast && <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/75 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap pointer-events-none">{toast}</div>}

          {/* lens sizes — overlaid on the viewfinder, just above the shutter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/35 rounded-full px-2 py-1.5 backdrop-blur-sm" dir="ltr">
            {[1, 2].map((z) => {
              const active = zoom === z;
              return (
                <button
                  key={z}
                  onClick={() => handleZoom(z)}
                  className={`rounded-full font-bold transition-all flex items-center justify-center ${active ? 'bg-white/90 text-black w-9 h-9 text-[13px]' : 'bg-white/15 text-white/85 w-7 h-7 text-[11px]'}`}
                >
                  {z === 1 ? '1×' : `${z}×`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control deck — photo history | shutter (+mode) | flip */}
      <div className="shrink-0 pb-7 pt-3 px-6">
        <div className="flex items-center justify-between">
          {/* Latest shot, stacked — tap to open the photo history */}
          <button ref={historyBtnRef} onClick={() => shots.length && setHistoryOpen(true)} aria-label="היסטוריית צילומים" className="relative w-12 h-12">
            {shots.length ? (
              <>
                <span className="absolute inset-0 rounded-xl bg-white/15 rotate-6" />
                <span className="absolute inset-0 rounded-xl bg-white/25 -rotate-3" />
                <span className="relative block w-full h-full rounded-xl overflow-hidden ring-1 ring-white/40">
                  <ShotMedia shot={shots[shots.length - 1]} className="w-full h-full object-cover" />
                </span>
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">{shots.length}</span>
              </>
            ) : (
              <span className="block w-full h-full rounded-xl ring-1 ring-white/15 bg-white/5" />
            )}
          </button>

          <div className="flex flex-col items-center gap-3">
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
                <span className="absolute inset-[23px] rounded-md bg-red-500" />
              ) : (
                <span className={`absolute inset-1.5 rounded-full ${mode === 'video' ? 'bg-red-500' : 'bg-white'}`} />
              )}
            </button>
            <div className="flex bg-white/10 rounded-full p-1 text-xs">
              <button onClick={() => !recording && setMode('photo')} className={`px-4 py-1 rounded-full font-bold transition-colors ${mode === 'photo' ? 'bg-white text-black' : 'text-white/70'}`}>תמונה</button>
              <button onClick={() => !recording && setMode('video')} className={`px-4 py-1 rounded-full font-bold transition-colors ${mode === 'video' ? 'bg-white text-black' : 'text-white/70'}`}>וידאו</button>
            </div>
          </div>

          <button onClick={flip} aria-label="החלפת מצלמה" className="w-12 h-12 rounded-full bg-white/12 text-white flex items-center justify-center">
            <SwitchCamera size={22} />
          </button>
        </div>
      </div>

      {/* Photo history — all shots this session; tap one to view / download / delete */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-950/95 backdrop-blur-sm flex flex-col" dir="rtl">
          <header className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
            <h2 className="text-white font-bold text-lg">הצילומים שלך</h2>
            <button onClick={() => setHistoryOpen(false)} className="text-white/70 text-sm px-3 py-1">סגירה</button>
          </header>
          <div className="flex-1 overflow-y-auto px-3 pb-6 min-h-0">
            {shots.length === 0 ? (
              <p className="text-center text-white/40 mt-16">עוד לא צילמת.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {[...shots].reverse().map((shot) => (
                  <button key={shot._id} onClick={() => setPreview(shot)} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 active:opacity-70">
                    <ShotMedia shot={shot} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Capture animation: the shot shrinks from the viewfinder into the history */}
      {fly && (
        <motion.img
          key={fly.url}
          src={fly.url}
          initial={{ x: fly.fromX - fly.toX, y: fly.fromY - fly.toY, scale: fly.fromSize / fly.toSize, opacity: 1 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: [1, 1, 0] }}
          transition={{ duration: 0.6, ease: [0.35, 0, 0.25, 1], opacity: { times: [0, 0.82, 1], duration: 0.6 } }}
          onAnimationComplete={() => setFly(null)}
          style={{
            position: 'fixed',
            left: fly.toX - fly.toSize / 2,
            top: fly.toY - fly.toSize / 2,
            width: fly.toSize,
            height: fly.toSize,
            borderRadius: 12,
            objectFit: 'cover',
            zIndex: 60,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        />
      )}

      {previewOverlay}
    </div>
  );
};

// Small mechanical frame-counter window with animated digits (counts down).
const FilmCounter = ({ value }: { value: number }) => (
  <div className="rounded-xl bg-black/70 ring-1 ring-white/15 px-2.5 pt-0.5 pb-1 backdrop-blur-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)]" dir="ltr">
    <div className="text-[7px] font-bold uppercase tracking-[0.2em] text-amber-300/60 text-center leading-none mb-0.5 translate-y-[2px]">shots</div>
    <div className="h-6 overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="block text-[22px] font-black tabular-nums leading-none text-amber-300"
          style={{ fontFamily: '"Courier New", monospace', textShadow: '0 0 8px rgba(255,150,0,0.55)' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  </div>
);

// Thumbnail that works for both photos (thumb → full fallback) and videos.
const ShotMedia = ({ shot, className }: { shot: DisposableShot; className?: string }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (shot.type === 'video') {
    // Prefer a poster IMAGE (instant local frame, or the server thumbnail) so the
    // tile never shows a black <video>; fall back to the <video> only if it fails.
    const hasPoster = !!shot.thumbnailUrl && shot.thumbnailUrl !== shot.url && !imgFailed;
    return (
      <>
        {hasPoster ? (
          <img src={shot.thumbnailUrl} alt="" loading="lazy" className={className} onError={() => setImgFailed(true)} />
        ) : (
          <video src={shot.url} muted playsInline preload="metadata" className={className} />
        )}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={12} className="text-white fill-current" />
          </span>
        </span>
      </>
    );
  }
  return (
    <img
      src={shot.thumbnailUrl}
      alt=""
      loading="lazy"
      className={className}
      onError={(e) => { const img = e.currentTarget; if (img.src !== shot.url) img.src = shot.url; }}
    />
  );
};

const Corner = ({ className }: { className: string }) => (
  <span className={`absolute w-5 h-5 border-white/40 rounded-sm pointer-events-none ${className}`} />
);

const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-neutral-950 text-white flex flex-col items-center justify-center px-6" dir="rtl">
    {children}
  </div>
);

export default DisposableCamera;
