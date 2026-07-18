import { Instagram, X } from 'lucide-react';

export interface Photographer {
  name?: string;
  instagram?: string; // bare handle, no @ or URL
}

/**
 * Small popup crediting the event's photographer. Instagram profiles can't be
 * iframed (they block embedding), so the button opens the real profile in a new
 * tab. Rounded corners + full border per design.
 */
export const PhotographerCard = ({
  photographer,
  onClose,
}: {
  photographer: Photographer;
  onClose: () => void;
}) => {
  const handle = (photographer.instagram || '').replace(/^@/, '');
  const igUrl = handle ? `https://instagram.com/${handle}` : undefined;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs bg-white rounded-3xl border-2 border-gray-200 shadow-2xl px-6 py-7 text-center"
      >
        <button
          onClick={onClose}
          aria-label="סגירה"
          className="absolute top-3 left-3 w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
        >
          <X size={18} />
        </button>

        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">צלם האירוע</p>
        <h3 className="mt-1 text-2xl font-bold text-black">{photographer.name || 'הצלם'}</h3>

        {handle && (
          <p className="mt-1 text-sm text-gray-500" dir="ltr">@{handle}</p>
        )}

        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white font-bold hover:brightness-105 transition"
          >
            <Instagram size={20} />
            פתיחת האינסטגרם
          </a>
        )}
      </div>
    </div>
  );
};

export default PhotographerCard;
