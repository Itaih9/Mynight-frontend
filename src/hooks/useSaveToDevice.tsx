import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { galleryApi } from '@/services/api';
import type { Photo } from '@/types/api.types';
import { saveUrl } from '@/lib/download';
import { ShareActionCard, type ShareActionCardProps } from '@/components/gallery/ShareActionCard';
import {
  SHARE_SHEET_LIMITS,
  type BatchLimits,
  type SaveQuality,
  type SaveStrategy,
  activationIsLive,
  currentDevice,
  estimatedBytes,
  fetchMediaFile,
  fileNameFor,
  formatMB,
  isVideoPhoto,
  isActivationExpired,
  isShareCancelled,
  mapPool,
  pickSaveStrategy,
  planBatches,
  readLimitOverrides,
} from '@/lib/saveToDevice';

/**
 * "Download these photos" for a gallery, done the way each device can use:
 * iPhone share sheet, Android downloads, zip everywhere else. The why is in
 * lib/saveToDevice.ts; this hook is the flow and the card that shows it.
 *
 *   const saver = useSaveToDevice();
 *   <button onClick={() => saver.start(photos, zipThem)}>…</button>
 *   {saver.card}
 *
 * `zip` is the caller's existing zip download. It runs on computers, and as
 * the fallback wherever the phone path cannot read the files.
 */

type Stage =
  | { kind: 'idle' }
  | { kind: 'choose'; items: Photo[]; strategy: Exclude<SaveStrategy, 'zip'>; zip: (items: Photo[]) => Promise<void> }
  | { kind: 'preparing'; done: number; total: number; round: number; rounds: number }
  | { kind: 'ready'; files: File[]; items: Photo[]; round: number; rounds: number }
  | { kind: 'downloading'; done: number; total: number }
  | { kind: 'zipping' }
  | { kind: 'leftovers'; items: Photo[]; index: number };

interface Plan {
  all: Photo[];
  rounds: Photo[][];
  /** Saved one per tap at the end: too large for a round, or refused by it. */
  leftovers: Photo[];
  limits: BatchLimits;
  zip: (items: Photo[]) => Promise<void>;
  quality: SaveQuality;
}

/** Paces the progress bar: a slow phone connection, roughly 1 MB/s, plus a moment to start. */
const expectedSecondsFor = (items: Photo[], quality: SaveQuality) =>
  1 + items.reduce((sum, p) => sum + estimatedBytes(p, quality), 0) / (1024 * 1024);

/** Fetches in flight while preparing a round. Browsers open six connections per host. */
const FETCH_CONCURRENCY = 6;
/** Pause between Android downloads, so the browser sees separate requests. */
const DOWNLOAD_GAP_MS = 350;

const signedUrlFor = (photo: Photo) => () => galleryApi.getDownloadUrl(photo._id).then((res) => res.data?.url);

/**
 * The API's own download route, relative so it is same-origin on both
 * mynight.co.il and www — `download` is only honoured same-origin, and only
 * then does the browser treat the link as a download from the first byte.
 */
const nativeDownloadUrl = (photo: Photo, quality: SaveQuality) =>
  `/api/photos/download/${encodeURIComponent(photo._id)}${quality === 'fast' ? '?variant=display' : ''}`;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Whether the share sheet takes this one file (it decides by type). */
const shareSheetAccepts = (file: File): boolean => {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};

const countText = (n: number) => (n === 1 ? 'קובץ אחד' : `${n} קבצים`);

export function useSaveToDevice() {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  // Every run takes a new id. Async work checks it before touching state, so
  // a cancelled, replaced or unmounted run stops instead of writing over the
  // one that followed it.
  const runRef = useRef(0);
  const planRef = useRef<Plan | null>(null);
  // True while a share sheet is open. A second share() call during that time
  // rejects (InvalidStateError), which must not read as "this round failed".
  const sharingRef = useRef(false);

  useEffect(
    () => () => {
      runRef.current += 1;
    },
    []
  );

  const cancel = useCallback(() => {
    runRef.current += 1;
    planRef.current = null;
    setStage({ kind: 'idle' });
  }, []);

  const isCurrent = (run: number) => run === runRef.current;

  const finish = (run: number) => {
    if (!isCurrent(run)) return;
    const plan = planRef.current;
    if (plan && plan.leftovers.length > 0) {
      setStage({ kind: 'leftovers', items: plan.leftovers, index: 0 });
      return;
    }
    planRef.current = null;
    setStage({ kind: 'idle' });
  };

  const fallBackToZip = async (run: number, items: Photo[]) => {
    const plan = planRef.current;
    if (!plan || !isCurrent(run)) return;
    setStage({ kind: 'zipping' });
    await plan.zip(items);
    if (!isCurrent(run)) return;
    planRef.current = null;
    setStage({ kind: 'idle' });
  };

  const advance = (run: number, round: number) => {
    const plan = planRef.current;
    if (!plan || !isCurrent(run)) return;
    if (round + 1 < plan.rounds.length) void prepareRound(run, round + 1);
    else finish(run);
  };

  /**
   * Open the share sheet for one prepared round. Called straight from a tap
   * (`fromTap`), or right after preparing while the first tap may still be
   * live — in which case a refusal just means "ask for the tap".
   */
  const shareRound = (run: number, round: number, files: File[], items: Photo[], fromTap: boolean) => {
    const plan = planRef.current;
    if (!plan || !isCurrent(run)) return;
    if (sharingRef.current) return;
    sharingRef.current = true;
    const rounds = plan.rounds.length;
    let sharing: Promise<void>;
    try {
      sharing = navigator.share({ files });
    } catch (err) {
      sharing = Promise.reject(err);
    }
    sharing.then(
      () => {
        sharingRef.current = false;
        advance(run, round);
      },
      (err: unknown) => {
        sharingRef.current = false;
        if (!isCurrent(run)) return;
        // Closed without saving, or the first tap had expired: offer the
        // button. The files are still in memory, so it is instant.
        if (isShareCancelled(err) || (!fromTap && isActivationExpired(err))) {
          setStage({ kind: 'ready', files, items, round: round + 1, rounds });
          return;
        }
        // The sheet refused this round outright. Its photos are saved one by
        // one at the end instead of being lost.
        plan.leftovers.push(...items);
        advance(run, round);
      }
    );
  };

  const prepareRound = async (run: number, round: number) => {
    const plan = planRef.current;
    if (!plan || !isCurrent(run)) return;
    const items = plan.rounds[round];
    setStage({ kind: 'preparing', done: 0, total: items.length, round: round + 1, rounds: plan.rounds.length });

    const results = await mapPool(
      items,
      FETCH_CONCURRENCY,
      (photo) => fetchMediaFile(photo, signedUrlFor(photo), plan.quality),
      (done) => {
        if (isCurrent(run)) setStage((s) => (s.kind === 'preparing' ? { ...s, done } : s));
      }
    );
    if (!isCurrent(run)) return;

    // Nothing at all could be read on the very first round: the bucket is
    // refusing the browser (CORS) or the network is gone. Everything goes to
    // the zip, which the server builds — the path that worked before.
    if (round === 0 && results.every((r) => !r.ok)) {
      await fallBackToZip(run, plan.all);
      return;
    }

    // The round was planned from the sizes the API reported. A size that is
    // missing or wrong would let the round carry far more than the cap, so the
    // cap is enforced again here on what actually arrived. Whatever does not
    // fit becomes the next round (and is planned the same way when it comes).
    const files: File[] = [];
    const shared: Photo[] = [];
    const overflow: Photo[] = [];
    let bytes = 0;
    results.forEach((result, i) => {
      if (!result.ok || !shareSheetAccepts(result.value) || result.value.size > plan.limits.maxBytes) {
        plan.leftovers.push(items[i]);
      } else if (overflow.length > 0 || bytes + result.value.size > plan.limits.maxBytes) {
        overflow.push(items[i]);
      } else {
        files.push(result.value);
        shared.push(items[i]);
        bytes += result.value.size;
      }
    });
    // Always strictly smaller than this round — it keeps at least one file or
    // moves one to the leftovers — so this cannot loop.
    if (overflow.length > 0) plan.rounds.splice(round + 1, 0, overflow);
    const rounds = plan.rounds.length;

    if (files.length === 0) {
      advance(run, round);
      return;
    }
    // Only the first round can still be riding the tap that started it.
    if (round === 0 && activationIsLive()) {
      shareRound(run, round, files, shared, false);
      return;
    }
    setStage({ kind: 'ready', files, items: shared, round: round + 1, rounds });
  };

  const runDownloads = async (run: number, items: Photo[]) => {
    const plan = planRef.current;
    if (!plan) return;
    setStage({ kind: 'downloading', done: 0, total: items.length });
    // Each file is handed to Android's own download manager through a
    // same-origin link, rather than fetched into this page first. The
    // download manager runs outside the tab: it keeps going when Chrome is in
    // the background (where battery saver cuts the page's network), resumes
    // after a dropped connection, and shows real progress in the
    // notifications. Fetching into the page lost every file to one blip on a
    // roaming connection (seen on a guest's phone, 2026-09-28).
    for (let i = 0; i < items.length; i += 1) {
      if (!isCurrent(run)) return;
      saveUrl(nativeDownloadUrl(items[i], plan.quality), fileNameFor(items[i], items[i].metadata?.mimeType || 'image/jpeg'));
      setStage({ kind: 'downloading', done: i + 1, total: items.length });
      if (i < items.length - 1) await sleep(DOWNLOAD_GAP_MS);
    }
    finish(run);
  };

  /**
   * Start saving `items`. Resolves when the zip is done on the zip path, and
   * straight away otherwise — the card carries the phone paths from there.
   */
  const start = useCallback(async (items: Photo[], zip: (items: Photo[]) => Promise<void>) => {
    if (items.length === 0) return;
    const strategy = pickSaveStrategy(currentDevice());
    if (strategy === 'zip') {
      await zip(items);
      return;
    }

    // On a phone the guest picks fast or full quality first. Their tap on
    // that choice is also a fresh activation for the share sheet.
    runRef.current += 1;
    planRef.current = null;
    setStage({ kind: 'choose', items, strategy, zip });
  }, []);

  const begin = (
    items: Photo[],
    strategy: Exclude<SaveStrategy, 'zip'>,
    zip: (items: Photo[]) => Promise<void>,
    quality: SaveQuality
  ) => {
    runRef.current += 1;
    const run = runRef.current;

    if (strategy === 'downloads') {
      planRef.current = { all: items, rounds: [], leftovers: [], limits: SHARE_SHEET_LIMITS, zip, quality };
      void runDownloads(run, items);
      return;
    }

    const limits = readLimitOverrides(window.location.search, SHARE_SHEET_LIMITS);
    const { batches, oversized } = planBatches(items, (p) => estimatedBytes(p, quality), limits);
    planRef.current = { all: items, rounds: batches, leftovers: [...oversized], limits, zip, quality };
    if (batches.length === 0) finish(run);
    else void prepareRound(run, 0);
  };

  const downloadLeftover = (items: Photo[], index: number) => {
    const photo = items[index];
    // A plain download: no fetch into memory, so neither size nor CORS stops it.
    galleryApi
      .getDownloadUrl(photo._id)
      .then((res) => saveUrl(res.data?.url || photo.url))
      .catch(() => saveUrl(photo.url));
    if (index + 1 < items.length) setStage({ kind: 'leftovers', items, index: index + 1 });
    else cancel();
  };

  const cardProps = (): ShareActionCardProps | null => {
    switch (stage.kind) {
      case 'idle':
        return null;
      case 'choose': {
        const { items, strategy, zip } = stage;
        const total = (quality: SaveQuality) => formatMB(items.reduce((sum, p) => sum + estimatedBytes(p, quality), 0));
        const noun = items.some(isVideoPhoto) ? 'קבצים' : 'תמונות';
        return {
          title: items.length === 1 ? `הורדת ${noun === 'קבצים' ? 'קובץ אחד' : 'תמונה אחת'}` : `הורדת ${items.length} ${noun}`,
          action: { label: `מהיר · ${total('fast')}`, onClick: () => begin(items, strategy, zip, 'fast') },
          secondaryAction: { label: `איכות מלאה · ${total('full')}`, onClick: () => begin(items, strategy, zip, 'full') },
          onCancel: cancel,
        };
      }
      case 'preparing': {
        const plan = planRef.current;
        const roundItems = plan?.rounds[stage.round - 1] ?? [];
        return {
          title: stage.rounds > 1 ? `מכין את התמונות (חלק ${stage.round} מתוך ${stage.rounds})` : 'מכין את התמונות…',
          detail: `${stage.done} מתוך ${stage.total}`,
          progress: stage.total ? stage.done / stage.total : 0,
          expectedSeconds: plan ? expectedSecondsFor(roundItems, plan.quality) : undefined,
          onCancel: cancel,
        };
      }
      case 'ready':
        return {
          title: 'התמונות מוכנות',
          detail:
            stage.rounds > 1
              ? `${countText(stage.files.length)} · חלק ${stage.round} מתוך ${stage.rounds}`
              : countText(stage.files.length),
          hint: 'בחלון שייפתח בחרו בשמירת התמונות',
          action: {
            label: 'שמירה לגלריה',
            onClick: () => shareRound(runRef.current, stage.round - 1, stage.files, stage.items, true),
          },
          onCancel: cancel,
        };
      case 'downloading':
        return {
          title: 'מוריד את התמונות…',
          detail: `${stage.done} מתוך ${stage.total}`,
          hint: 'אם הדפדפן שואל — אשרו הורדה של כמה קבצים',
          progress: stage.total ? stage.done / stage.total : 0,
          expectedSeconds: planRef.current ? expectedSecondsFor(planRef.current.all, planRef.current.quality) : undefined,
          onCancel: cancel,
        };
      case 'zipping':
        // No cancel: the server is already building the zip, and it downloads
        // when done whatever this card says. No real progress exists, so the
        // bar paces itself on the originals' size.
        return {
          title: 'מכין את הקובץ להורדה…',
          progress: 0,
          expectedSeconds: planRef.current ? 2 * expectedSecondsFor(planRef.current.all, 'full') : undefined,
        };
      case 'leftovers':
        return {
          title: stage.items.length === 1 ? 'נשאר קובץ אחד' : `נשארו ${stage.items.length} קבצים`,
          detail: 'את אלה מורידים אחד-אחד',
          action: {
            label: `הורדה (${stage.index + 1} מתוך ${stage.items.length})`,
            onClick: () => downloadLeftover(stage.items, stage.index),
          },
          onCancel: cancel,
        };
    }
  };

  const props = cardProps();
  const card = (
    <AnimatePresence>{props && <ShareActionCard key="save-to-device" {...props} />}</AnimatePresence>
  );

  return { start, cancel, card, active: stage.kind !== 'idle' };
}

export default useSaveToDevice;
