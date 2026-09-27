import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

export interface ShareActionCardProps {
  title: string;
  detail?: string;
  /** A short instruction under the detail, e.g. what to pick in the share sheet. */
  hint?: string;
  /** 0–1. Shown as a bar while work is in progress. */
  progress?: number;
  /** Roughly how long the work should take; paces the bar between real updates. */
  expectedSeconds?: number;
  /** Omitted while there is nothing for the user to tap yet. */
  action?: { label: string; onClick: () => void };
  /** A second, outlined button under `action`. */
  secondaryAction?: { label: string; onClick: () => void };
  /** Omitted when the work cannot be stopped any more. */
  onCancel?: () => void;
}

/** Where the bar stops creeping on its own; only real completion goes past it. */
const CREEP_CEILING = 0.92;

/**
 * A progress bar that keeps moving whether or not real progress has arrived.
 * Downloads report per file, so with three files the real value sits at 0 for
 * most of the wait and the bar looked frozen. The bar eases toward
 * CREEP_CEILING over about `expectedSeconds`, and jumps ahead whenever the real
 * progress is further along. It starts over when real progress goes backwards
 * (a new round).
 */
const CreepingBar = ({ progress, expectedSeconds }: { progress: number; expectedSeconds: number }) => {
  const startRef = useRef(Date.now());
  const lastRealRef = useRef(progress);
  const [now, setNow] = useState(Date.now());

  if (progress < lastRealRef.current) startRef.current = Date.now();
  lastRealRef.current = progress;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.max(0, (now - startRef.current) / 1000);
  // At expectedSeconds the bar shows ~86% of the ceiling, then slows.
  const creep = CREEP_CEILING * (1 - Math.exp(-elapsed / Math.max(0.5, expectedSeconds / 2)));
  const real = Math.min(1, Math.max(0, progress));
  const shown = real >= 1 ? 1 : Math.max(real, creep);

  return (
    <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden" dir="ltr">
      <div
        className="h-full bg-gold-primary transition-[width] duration-300 ease-linear"
        style={{ width: `${Math.round(shown * 100)}%` }}
      />
    </div>
  );
};

/**
 * A card pinned to the bottom of the screen for the step between "we are
 * getting your files" and "the share sheet is open".
 *
 * It exists because a share sheet only opens from a tap, and preparing the
 * files usually outlasts the tap that asked for them. The card's button is a
 * fresh tap, so the sheet opens from it reliably. It sits above every other
 * layer — the gallery, the lightbox and the face album all reach it.
 */
export const ShareActionCard = ({
  title,
  detail,
  hint,
  progress,
  expectedSeconds = 6,
  action,
  secondaryAction,
  onCancel,
}: ShareActionCardProps) => (
  <motion.div
    initial={{ y: 120, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 120, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
    className="fixed inset-x-0 bottom-0 z-[330] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    dir="rtl"
    role="dialog"
    aria-live="polite"
    aria-label={title}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="mx-auto max-w-md bg-white rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border border-gray-100 p-5 pointer-events-auto">
      <div className="flex items-start gap-3">
        {!action && <Loader2 size={22} className="animate-spin text-gold-primary shrink-0 mt-0.5" />}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-base text-black leading-tight">{title}</p>
          {detail && <p className="text-sm text-gray-500 mt-1">{detail}</p>}
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1.5 -m-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors shrink-0"
            aria-label="ביטול"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {typeof progress === 'number' && <CreepingBar progress={progress} expectedSeconds={expectedSeconds} />}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 w-full py-3.5 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-2 w-full py-3.5 bg-white text-black border border-black rounded-full font-bold hover:bg-gray-50 transition-colors active:scale-[0.98]"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  </motion.div>
);

export default ShareActionCard;
