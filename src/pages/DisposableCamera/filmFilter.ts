/**
 * Renders a video frame to a canvas with a disposable-camera look and returns a
 * JPEG blob. All original processing: a warm tone curve, subtle grain, vignette,
 * and the classic corner date stamp. Runs once per shot, so per-pixel work is fine.
 */
export async function renderFilmFrame(
  video: HTMLVideoElement,
  opts: { maxWidth?: number; dateStamp?: boolean; zoom?: number; mirror?: boolean } = {}
): Promise<Blob> {
  const maxW = opts.maxWidth ?? 1280;
  const zoom = Math.max(1, opts.zoom ?? 1);
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 960;
  // Digital zoom: draw a centered crop of the source, scaled to fill.
  const sw = vw / zoom;
  const sh = vh / zoom;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  const scale = Math.min(1, maxW / sw);
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Front camera: mirror horizontally so the saved photo matches the (mirrored)
  // selfie preview instead of coming out reversed. Tone/grain below are applied
  // to the already-drawn pixels, so they're unaffected by this transform.
  if (opts.mirror) {
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  }

  // --- Tone curve: warm highlights, lifted-but-cooled shadows, more contrast ---
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const contrast = 1.12;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    // contrast around mid gray
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    // warm: nudge red up, blue down; lift shadows slightly (film base)
    r = r + 10;
    b = b - 8;
    r += 6; g += 3; b += 2; // faint overall lift
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(img, 0, 0);

  // --- Grain: sparse light/dark specks blended over the frame ---
  const grain = document.createElement('canvas');
  grain.width = w;
  grain.height = h;
  const gctx = grain.getContext('2d')!;
  const gimg = gctx.createImageData(w, h);
  const gd = gimg.data;
  for (let i = 0; i < gd.length; i += 4) {
    const n = (Math.random() * 255) | 0;
    gd[i] = gd[i + 1] = gd[i + 2] = n;
    gd[i + 3] = Math.random() < 0.5 ? 18 : 0; // ~50% coverage, low opacity
  }
  gctx.putImageData(gimg, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5;
  ctx.drawImage(grain, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // --- Vignette ---
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // --- Date stamp (bottom-right, that unmistakable orange 7-seg glow) ---
  if (opts.dateStamp !== false) {
    const now = new Date();
    const stamp = `'${String(now.getFullYear()).slice(2)} ${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}`;
    const size = Math.round(h * 0.045);
    ctx.font = `${size}px "Courier New", monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(255,120,0,0.9)';
    ctx.shadowBlur = size * 0.5;
    ctx.fillStyle = '#ff7a1a';
    ctx.fillText(stamp, w - size, h - size * 0.7);
    ctx.shadowBlur = 0;
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92);
  });
}
