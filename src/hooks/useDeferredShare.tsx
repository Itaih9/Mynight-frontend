import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShareActionCard } from '@/components/gallery/ShareActionCard';
import { activationIsLive, isActivationExpired, isShareCancelled } from '@/lib/saveToDevice';

export interface PreparedShare {
  /** What to hand the share sheet. Leave out when there is nothing to share (the fetch failed). */
  data?: ShareData;
  /**
   * What to do instead when the share sheet cannot take `data` — open WhatsApp
   * with a link, save the file. Return `false` if it could not act, e.g. a
   * popup the browser blocked, so the user is asked for a tap and it re-runs.
   */
  fallback: () => boolean | void;
}

type Outcome = 'done' | 'needs-tap';

/**
 * Share one downloaded file from a tap, reliably.
 *
 * The share handlers used to await the download and then call
 * navigator.share. The browser only opens the share sheet within about five
 * seconds of a tap, and a photo — let alone a video — often takes longer, so
 * the call was refused. The refusal landed in a catch that opened WhatsApp as
 * a popup, which the browser also blocked, since the tap had expired for that
 * too. The user tapped and nothing happened, with no error shown.
 *
 * Now the share is tried right away, which still works when the file is quick.
 * If the tap has expired, a card offers a "שיתוף" button, and that fresh tap
 * opens the sheet (or the fallback) with the file already in memory.
 *
 * Closing the share sheet without picking anything is a choice, not a failure,
 * and no longer bounces the user into WhatsApp.
 */
export function useDeferredShare() {
  const [preparing, setPreparing] = useState(false);
  const [ready, setReady] = useState<PreparedShare | null>(null);
  const busyRef = useRef(false);

  const deliver = (prepared: PreparedShare, fromTap: boolean): Promise<Outcome> => {
    const { data } = prepared;
    const hasFiles = Boolean(data?.files && data.files.length > 0);
    const shareable =
      data !== undefined &&
      typeof navigator.share === 'function' &&
      // Files need an explicit yes; a link or text only needs share() itself.
      (!hasFiles || (typeof navigator.canShare === 'function' && navigator.canShare(data)));

    const runFallback = (): Outcome => (prepared.fallback() === false && !fromTap ? 'needs-tap' : 'done');

    if (!shareable) return Promise.resolve(runFallback());

    let sharing: Promise<void>;
    try {
      sharing = navigator.share(data);
    } catch (err) {
      sharing = Promise.reject(err);
    }
    return sharing.then(
      () => 'done' as Outcome,
      (err: unknown): Outcome => {
        if (isShareCancelled(err)) return 'done';
        if (!fromTap && isActivationExpired(err)) return 'needs-tap';
        return runFallback();
      }
    );
  };

  /**
   * Prepare with `build` (the slow part: download the file), then share.
   * `build` should not throw — return `{ fallback }` alone when the file
   * could not be fetched.
   */
  const run = useCallback(async (build: () => Promise<PreparedShare>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPreparing(true);
    setReady(null);
    let prepared: PreparedShare;
    try {
      prepared = await build();
    } finally {
      busyRef.current = false;
      setPreparing(false);
    }
    const outcome = activationIsLive() ? await deliver(prepared, false) : 'needs-tap';
    if (outcome === 'needs-tap') setReady(prepared);
    // deliver reads nothing from render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = (
    <AnimatePresence>
      {ready && (
        <ShareActionCard
          key="deferred-share"
          title="מוכן לשיתוף"
          action={{
            label: 'שיתוף',
            onClick: () => {
              const prepared = ready;
              setReady(null);
              void deliver(prepared, true);
            },
          }}
          onCancel={() => setReady(null)}
        />
      )}
    </AnimatePresence>
  );

  return { run, preparing, card };
}

export default useDeferredShare;
