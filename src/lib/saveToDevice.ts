/**
 * Saving several photos to a phone as separate files, instead of one zip.
 *
 * A zip is the right thing on a computer and the wrong thing on a phone: an
 * iPhone files it under Files, not Photos, and most guests never find it again.
 * Each platform has a different way to put separate files where people look:
 *
 * - iPhone / iPad: the share sheet. Handed a list of files, it offers
 *   "Save N Images", which puts every one of them straight into Photos.
 * - Android: plain downloads, one per file. Android's share sheet only lists
 *   apps — there is no "save to phone" target in it — whereas a downloaded
 *   photo lands in Downloads, which the gallery apps show. Chrome asks once
 *   whether the site may download several files.
 * - Everything else (computers): the zip, as before.
 *
 * Two browser rules shape the rest of this file:
 *
 * 1. The share sheet only opens from a tap. Both WebKit and Blink allow about
 *    five seconds after it ("transient activation"). Downloading the photos
 *    takes longer than that, so the sheet is usually opened by a SECOND tap,
 *    once the files are in memory. The one-tap path is still tried first —
 *    see `activationIsLive`.
 * 2. Every file is held in memory until the share sheet is done with it, so
 *    one share carries a bounded amount: BATCH limits below. Larger selections
 *    are saved in several rounds, one tap each.
 *
 * Both paths read the media with fetch(), which needs the storage bucket to
 * allow CORS GET from the site. If it doesn't, the first fetch fails and the
 * caller falls back to the zip — never worse than before.
 */
import type { Photo } from '@/types/api.types';

export type SaveStrategy = 'share-sheet' | 'downloads' | 'zip';

const MB = 1024 * 1024;

export interface BatchLimits {
  maxFiles: number;
  maxBytes: number;
}

/**
 * How much one iPhone share-sheet round may carry.
 *
 * Safari itself has handled 200+ files and ~300 MB in one share. What bounds
 * us is memory: every file of the round is held at once, and an iPhone that
 * runs out reloads the tab. These are deliberately conservative starting
 * points — tune them on a real phone with `?saveBatch=` and `?saveMB=`
 * (see readLimitOverrides) before changing them here.
 */
export const SHARE_SHEET_LIMITS: BatchLimits = { maxFiles: 30, maxBytes: 200 * MB };

/** Planning guesses for media whose size the API did not report. */
export const UNKNOWN_IMAGE_BYTES = 8 * MB;
export const UNKNOWN_VIDEO_BYTES = 80 * MB;

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** Whether the browser can put FILES (not just a link) on its share sheet. */
  canShareFiles: boolean;
}

/**
 * iPadOS reports itself as a Mac; a Mac with a touch screen is an iPad.
 * Every browser on iOS is WebKit underneath, so Chrome on iPhone counts too.
 */
export const isAppleMobile = ({ userAgent, platform, maxTouchPoints }: DeviceInfo): boolean =>
  /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);

export const isAndroid = ({ userAgent }: DeviceInfo): boolean => /Android/i.test(userAgent);

export const pickSaveStrategy = (device: DeviceInfo): SaveStrategy => {
  // Before iOS 15 the share sheet cannot take files; the zip is all there is.
  if (isAppleMobile(device)) return device.canShareFiles ? 'share-sheet' : 'zip';
  if (isAndroid(device)) return 'downloads';
  return 'zip';
};

const probeCanShareFiles = (): boolean => {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  try {
    const probe = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'probe.jpg', { type: 'image/jpeg' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

export const currentDevice = (): DeviceInfo => ({
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  maxTouchPoints: navigator.maxTouchPoints || 0,
  canShareFiles: probeCanShareFiles(),
});

const positiveNumber = (raw: string | null): number | null => {
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Per-visit overrides for tuning on a real phone without a deploy:
 * `?saveBatch=50&saveMB=400` on the gallery URL. Anything missing, empty,
 * zero or non-numeric keeps the default.
 */
export const readLimitOverrides = (search: string, base: BatchLimits): BatchLimits => {
  const params = new URLSearchParams(search);
  const files = positiveNumber(params.get('saveBatch'));
  const megabytes = positiveNumber(params.get('saveMB'));
  return {
    maxFiles: files !== null ? Math.floor(files) || base.maxFiles : base.maxFiles,
    maxBytes: megabytes !== null ? megabytes * MB : base.maxBytes,
  };
};

export const isVideoPhoto = (photo: Photo): boolean => Boolean(photo.metadata?.mimeType?.startsWith('video/'));

/**
 * What the guest chose to save: the web copy the gallery shows (~2048px,
 * ~0.3 MB) or the original upload (~4 MB for a photographer's JPEG). The web
 * copy is about ten times faster on a phone and sharp on any screen; the
 * original is for printing.
 */
export type SaveQuality = 'fast' | 'full';

/** A web copy's typical size (measured: 0.2–0.3 MB for a 4 MB original). */
export const FAST_IMAGE_BYTES = 0.3 * MB;

/** The size to plan with: the reported one, else a guess by kind. */
export const estimatedBytes = (photo: Photo, quality: SaveQuality = 'full'): number => {
  const size = photo.metadata?.size;
  const known = typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : null;
  // Videos have no reliable web copy yet, so they are fetched in full either way.
  if (quality === 'fast' && !isVideoPhoto(photo) && photo.displayUrl) {
    return known !== null ? Math.min(known, FAST_IMAGE_BYTES) : FAST_IMAGE_BYTES;
  }
  if (known !== null) return known;
  return isVideoPhoto(photo) ? UNKNOWN_VIDEO_BYTES : UNKNOWN_IMAGE_BYTES;
};

/** "0.6MB", "3.4MB", "12MB" — one decimal below 10 MB. */
export const formatMB = (bytes: number): string => {
  const mb = bytes / MB;
  return mb >= 10 ? `${Math.round(mb)}MB` : `${Math.max(0.1, Math.round(mb * 10) / 10)}MB`;
};

export interface BatchPlan<T> {
  batches: T[][];
  /** Items too large for any round on their own — these are saved one by one. */
  oversized: T[];
}

/**
 * Split items into rounds, in order, each within `limits`. Greedy: a round
 * closes when the next item would overflow it. Nothing is dropped — an item
 * no round can hold goes to `oversized`.
 */
export const planBatches = <T>(items: T[], sizeOf: (item: T) => number, limits: BatchLimits): BatchPlan<T> => {
  const batches: T[][] = [];
  const oversized: T[] = [];
  let current: T[] = [];
  let currentBytes = 0;

  for (const item of items) {
    const bytes = sizeOf(item);
    if (bytes > limits.maxBytes) {
      oversized.push(item);
      continue;
    }
    if (current.length > 0 && (current.length >= limits.maxFiles || currentBytes + bytes > limits.maxBytes)) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(item);
    currentBytes += bytes;
  }
  if (current.length > 0) batches.push(current);
  return { batches, oversized };
};

const GENERIC_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

const baseType = (type: string | undefined): string => (type || '').split(';')[0].trim().toLowerCase();

/**
 * The type to label a file with. The share sheet decides what it offers from
 * this — "Save Image" appears only for an image type — so a generic type from
 * storage is replaced by the one the API recorded at upload.
 */
export const pickMimeType = (blobType: string | undefined, declared: string | undefined): string => {
  const fromBlob = baseType(blobType);
  if (!GENERIC_TYPES.has(fromBlob)) return fromBlob;
  const fromApi = baseType(declared);
  if (!GENERIC_TYPES.has(fromApi)) return fromApi;
  return 'image/jpeg';
};

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

export const extensionFor = (mimeType: string): string =>
  EXTENSIONS[baseType(mimeType)] ?? (baseType(mimeType).startsWith('video/') ? 'mp4' : 'jpg');

export const fileNameFor = (photo: Photo, mimeType: string): string => `mynight-${photo._id}.${extensionFor(mimeType)}`;

/**
 * Download one photo into a File. For 'fast', the web copy first. Then the
 * signed original (what the single-photo download and the zip use), then the
 * public URL. Throws if none can be read — a CORS refusal surfaces here as a
 * TypeError.
 */
export const fetchMediaFile = async (
  photo: Photo,
  signedUrl: () => Promise<string | undefined>,
  quality: SaveQuality = 'full',
): Promise<File> => {
  // Resolved one at a time, so the signed URL (an API round trip) is only
  // asked for when the web copy could not be read.
  const candidates: (() => Promise<string | undefined>)[] = [];
  if (quality === 'fast' && !isVideoPhoto(photo) && photo.displayUrl) {
    const displayUrl = photo.displayUrl;
    candidates.push(async () => displayUrl);
  }
  candidates.push(() => signedUrl().catch(() => undefined));
  candidates.push(async () => photo.url);

  const tried = new Set<string>();
  let lastError: unknown = new Error('No URL to fetch');
  for (const resolve of candidates) {
    const url = await resolve();
    if (!url || tried.has(url)) continue;
    tried.add(url);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const type = pickMimeType(blob.type, photo.metadata?.mimeType);
      return new File([blob], fileNameFor(photo, type), { type });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};

/**
 * Run `task` over `items` with at most `limit` in flight, keeping order.
 * Each result is either the value or the error, so one failure does not
 * lose the others.
 */
export const mapPool = async <T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
  onSettled?: (settled: number) => void,
): Promise<({ ok: true; value: R } | { ok: false; error: unknown })[]> => {
  const results: ({ ok: true; value: R } | { ok: false; error: unknown })[] = new Array(items.length);
  let next = 0;
  let settled = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { ok: true, value: await task(items[index]) };
      } catch (error) {
        results[index] = { ok: false, error };
      }
      settled += 1;
      onSettled?.(settled);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
};

/**
 * Whether the tap that started this is still "live" — i.e. the share sheet
 * may be opened now without asking for another tap. Browsers without the
 * User Activation API (Safari before 16.4) report unknown; we try, and the
 * share call's NotAllowedError tells us if it was too late.
 */
export const activationIsLive = (): boolean => {
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  return activation ? activation.isActive : true;
};

export const errorName = (err: unknown): string | undefined =>
  err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : undefined;

/** The share sheet was closed without choosing anything. Not an error. */
export const isShareCancelled = (err: unknown): boolean => errorName(err) === 'AbortError';

/** The browser refused because no tap was live. Retrying from a new tap works. */
export const isActivationExpired = (err: unknown): boolean => errorName(err) === 'NotAllowedError';
