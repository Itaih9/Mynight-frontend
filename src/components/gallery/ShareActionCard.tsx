import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

export interface ShareActionCardProps {
  title: string;
  detail?: string;
  /** A short instruction under the detail, e.g. what to pick in the share sheet. */
  hint?: string;
  /** 0–1. Shown as a bar while work is in progress. */
  progress?: number;
  /** Omitted while there is nothing for the user to tap yet. */
  action?: { label: string; onClick: () => void };
  /** Omitted when the work cannot be stopped any more. */
  onCancel?: () => void;
}

/**
 * A card pinned to the bottom of the screen for the step between "we are
 * getting your files" and "the share sheet is open".
 *
 * It exists because a share sheet only opens from a tap, and preparing the
 * files usually outlasts the tap that asked for them. The card's button is a
 * fresh tap, so the sheet opens from it reliably. It sits above every other
 * layer — the gallery, the lightbox and the face album all reach it.
 */
export const ShareActionCard = ({ title, detail, hint, progress, action, onCancel }: ShareActionCardProps) => (
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

      {typeof progress === 'number' && (
        <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden" dir="ltr">
          <div
            className="h-full bg-gold-primary transition-[width] duration-300"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 w-full py-3.5 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </div>
  </motion.div>
);

export default ShareActionCard;
