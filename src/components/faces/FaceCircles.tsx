import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { faceCircleImageStyle, type FaceBoundingBox, type FaceEntry } from './faceCrop';

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
 * Mobile: a bottom-left strip — circles overlap as one tight group when idle and
 * spread into a scrollable row with a soft, staggered float on tap. Desktop: a
 * 2-per-row scrollable grid to the right of the photo. Rendered only while the
 * lightbox is open (never for grid thumbnails).
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

  const previewCount = Math.min(sorted.length, 5);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // A clean, perfectly-round face thumbnail: the outer element is a white circle
  // (a thin ring), the inner element clips the image to a circle. clip-path (not
  // just overflow-hidden) avoids the iOS square-edge artifact.
  const circleFace = (box: FaceBoundingBox, size: number) => (
    <span
      className="absolute inset-[2px] rounded-full overflow-hidden bg-gray-200"
      style={{ clipPath: 'circle(50%)' }}
    >
      <img src={imageUrl} alt="" draggable={false} style={faceCircleImageStyle(box, imgWidth, imgHeight, size - 4)} />
    </span>
  );

  return (
    <>
      {/* MOBILE — bottom-left strip. Stop touch/scroll events so the strip scrolls
          on its own instead of being read as a photo swipe. */}
      <div
        className="md:hidden absolute bottom-24 left-4 z-40 max-w-[82vw]"
        onClick={stop}
        onTouchStart={stop}
        onTouchMove={stop}
        onTouchEnd={stop}
      >
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            dir="ltr"
            className="flex items-center active:scale-95 transition-transform"
            aria-label="הצגת הפרצופים בתמונה"
          >
            {sorted.slice(0, previewCount).map((face, i) => (
              <span
                key={face.faceId}
                className="relative block shrink-0 rounded-full bg-white shadow-md"
                style={{ width: 46, height: 46, marginLeft: i === 0 ? 0 : -16, zIndex: previewCount - i }}
              >
                {circleFace(face.boundingBox, 46)}
              </span>
            ))}
          </button>
        ) : (
          <motion.div
            dir="ltr"
            className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {sorted.map((face) => (
              <motion.button
                key={face.faceId}
                onClick={() => onFaceClick(face)}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.5 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 210, damping: 15 } },
                }}
                className="relative block shrink-0 rounded-full bg-white shadow-md active:scale-95"
                style={{ width: 50, height: 50 }}
                aria-label="הצגת כל התמונות של הפרצוף"
              >
                {circleFace(face.boundingBox, 50)}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* DESKTOP — 2-per-row scrollable grid on the right */}
      <div
        className="hidden md:grid grid-cols-2 gap-3 absolute right-3 top-1/2 -translate-y-1/2 z-40 max-h-[74vh] overflow-y-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        onClick={stop}
      >
        {sorted.map((face) => (
          <button
            key={face.faceId}
            onClick={() => onFaceClick(face)}
            className="relative block shrink-0 rounded-full bg-white shadow-md transition-transform hover:scale-105"
            style={{ width: 56, height: 56 }}
            aria-label="הצגת כל התמונות של הפרצוף"
          >
            {circleFace(face.boundingBox, 56)}
          </button>
        ))}
      </div>
    </>
  );
};

export default FaceCircles;
