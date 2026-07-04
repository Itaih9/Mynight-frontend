import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { faceCircleImageStyle, type FaceEntry } from './faceCrop';

interface FaceCirclesProps {
  /** Display rendition of the currently-open photo, cropped for each circle. */
  imageUrl: string;
  imgWidth?: number;
  imgHeight?: number;
  faces: FaceEntry[];
  onFaceClick: (face: FaceEntry) => void;
}

/**
 * Circular face thumbnails for the faces detected in the open lightbox photo.
 * Mobile: a horizontal strip in the bottom-left — circles overlap when idle and
 * spread into a scrollable row with a soft, staggered float when tapped.
 * Desktop: a vertical, scrollable column to the right of the photo.
 * Rendered only while the lightbox is open (never for grid thumbnails).
 */
export const FaceCircles = ({ imageUrl, imgWidth, imgHeight, faces, onFaceClick }: FaceCirclesProps) => {
  // Biggest/closest faces first.
  const sorted = useMemo(
    () => [...faces].sort((a, b) => b.boundingBox.Width - a.boundingBox.Width),
    [faces]
  );

  const [expanded, setExpanded] = useState(false);
  // Collapse again whenever the open photo changes.
  useEffect(() => {
    setExpanded(false);
  }, [imageUrl]);

  if (sorted.length === 0) return null;

  const previewCount = Math.min(sorted.length, 4);

  return (
    <>
      {/* MOBILE — bottom-left strip (raised to clear the caption / nav controls) */}
      <div
        className="md:hidden absolute bottom-24 left-4 z-40 max-w-[78vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center active:scale-95 transition-transform"
            aria-label="הצגת הפרצופים בתמונה"
          >
            {sorted.slice(0, previewCount).map((face, i) => (
              <span
                key={face.faceId}
                className="relative rounded-full overflow-hidden ring-2 ring-white shadow-lg bg-gray-200"
                style={{ width: 44, height: 44, marginLeft: i === 0 ? 0 : -20, zIndex: previewCount - i }}
              >
                <img src={imageUrl} alt="" draggable={false} style={faceCircleImageStyle(face.boundingBox, imgWidth, imgHeight, 44)} />
              </span>
            ))}
            {sorted.length > previewCount && (
              <span
                className="relative flex items-center justify-center rounded-full ring-2 ring-white shadow-lg bg-black/70 text-white text-xs font-bold"
                style={{ width: 44, height: 44, marginLeft: -20 }}
              >
                +{sorted.length - previewCount}
              </span>
            )}
          </button>
        ) : (
          <motion.div
            className="flex items-center gap-2.5 overflow-x-auto py-1 pl-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.055 } } }}
          >
            {sorted.map((face) => (
              <motion.button
                key={face.faceId}
                onClick={() => onFaceClick(face)}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.55 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 210, damping: 15 } },
                }}
                className="relative rounded-full overflow-hidden ring-2 ring-white shadow-lg bg-gray-200 shrink-0 active:scale-95"
                style={{ width: 48, height: 48 }}
              >
                <img src={imageUrl} alt="" draggable={false} style={faceCircleImageStyle(face.boundingBox, imgWidth, imgHeight, 48)} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* DESKTOP — vertical column on the right (inset to clear the nav arrow) */}
      <div
        className="hidden md:flex absolute right-20 top-1/2 -translate-y-1/2 z-40 flex-col gap-3 max-h-[72vh] overflow-y-auto py-2 pr-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        onClick={(e) => e.stopPropagation()}
      >
        {sorted.map((face) => (
          <button
            key={face.faceId}
            onClick={() => onFaceClick(face)}
            className="relative rounded-full overflow-hidden ring-2 ring-white shadow-lg bg-gray-200 shrink-0 transition-all hover:ring-gold-primary hover:scale-105"
            style={{ width: 54, height: 54 }}
            aria-label="הצגת כל התמונות של הפרצוף"
          >
            <img src={imageUrl} alt="" draggable={false} style={faceCircleImageStyle(face.boundingBox, imgWidth, imgHeight, 54)} />
          </button>
        ))}
      </div>
    </>
  );
};

export default FaceCircles;
