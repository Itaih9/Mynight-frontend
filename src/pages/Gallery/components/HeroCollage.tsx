import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MediaItem } from '../types';

// Use the grid-cached thumbnail (not the full-size original) so the top hero
// photos paint instantly from cache instead of fetching big files.
const getHeroPreviewSrc = (item?: MediaItem) => {
  if (!item) return '';
  return item.type === 'photo' ? (item.thumbnail || item.url || '') : '';
};

const getHeroFullSrc = (item?: MediaItem) => {
  if (!item) return '';
  return item.type === 'photo' ? (item.thumbnail || item.url || '') : '';
};

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: number) => {
  let state = seed || 1;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const VerticalColumn = ({ images, delay }: { images: MediaItem[], delay: number }) => {
  const [index, setIndex] = useState(0);
  const [fullLoaded, setFullLoaded] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (images.length === 0) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const nextDuration = Math.random() * (7200 - 5000) + 5000;
      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % images.length);
        scheduleNext();
      }, nextDuration);
    };
    const startTimeout = setTimeout(() => {
       scheduleNext();
    }, delay);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [delay, images.length]);

  useEffect(() => {
    setFullLoaded(false);
  }, [index, images]);

  useEffect(() => {
    if (isFirstRender.current) {
        const t = setTimeout(() => {
            isFirstRender.current = false;
        }, 100);
        return () => clearTimeout(t);
    }
  }, []);

  if (images.length === 0) return <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black" />;

  const currentItem = images[index];
  const previewSrc = getHeroPreviewSrc(currentItem);
  const fullSrc = getHeroFullSrc(currentItem);
  const shouldLoadFull = Boolean(fullSrc && fullSrc !== previewSrc);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentItem.id}
          initial={isFirstRender.current ?
            { opacity: 1, filter: 'blur(0px)', scale: 1.35, x: '0%' } :
            { opacity: 0, filter: 'blur(20px)', scale: 1.35, x: '0%' }
          }
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1.35, x: '-10%' }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.35 }}
          transition={{
            opacity: { duration: 1.5, ease: "easeInOut" },
            filter: { duration: 1.5, ease: "easeInOut" },
            x: { duration: 18, ease: "linear" }
          }}
          className="absolute inset-0 w-full h-full will-change-[opacity,filter,transform]"
          style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
        >
          {previewSrc && (
            <img
              src={previewSrc}
              className={`absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-700 ease-in-out ${fullLoaded && shouldLoadFull ? 'opacity-0' : 'opacity-70'}`}
              alt=""
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          )}
          {shouldLoadFull && (
            <img
              src={fullSrc}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${fullLoaded ? 'opacity-70' : 'opacity-0'}`}
              alt=""
              loading="eager"
              decoding="async"
              onLoad={() => setFullLoaded(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const HeroVerticalCollage = React.memo(({ items }: { items: MediaItem[] }) => {
  useEffect(() => {
    const preloadImages = items
      .map(getHeroPreviewSrc)
      .filter(Boolean)
      .slice(0, 9);
    const preloadLinks: HTMLLinkElement[] = [];

    preloadImages.forEach(item => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = item;
      link.dataset.heroCollagePreload = 'true';
      link.fetchPriority = 'high' as any;
      document.head.appendChild(link);
      preloadLinks.push(link);
    });

    return () => {
      preloadLinks.forEach((link) => link.parentNode?.removeChild(link));
    };
  }, [items]);

  const spreadItems = useMemo(() => {
    const photoItems = items.filter((item) => item.type === 'photo' && item.url);
    if (photoItems.length <= 3) return photoItems;
    const sorted = [...photoItems].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const step = Math.max(1, Math.floor(sorted.length / 30));
    const picked: MediaItem[] = [];
    for (let i = 0; i < sorted.length && picked.length < 30; i += step) {
      picked.push(sorted[i]);
    }
    const random = createSeededRandom(hashString(picked.map((item) => item.id).join('|')));
    for (let i = picked.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked;
  }, [items]);

  const col1 = useMemo(() => spreadItems.filter((_, i) => i % 3 === 0), [spreadItems]);
  const col2 = useMemo(() => spreadItems.filter((_, i) => i % 3 === 1), [spreadItems]);
  const col3 = useMemo(() => spreadItems.filter((_, i) => i % 3 === 2), [spreadItems]);
  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="md:hidden w-full h-full flex flex-col">
         <div className="h-1/3 w-full relative border-b border-white/5">
            <VerticalColumn images={col1} delay={0} />
         </div>
         <div className="h-1/3 w-full relative border-b border-white/5">
            <VerticalColumn images={col2} delay={2300} />
         </div>
         <div className="h-1/3 w-full relative">
            <VerticalColumn images={col3} delay={4600} />
         </div>
      </div>
      <div className="hidden md:flex w-full h-full">
         <div className="w-1/3 h-full relative border-r border-white/5">
            <VerticalColumn images={col1} delay={0} />
         </div>
         <div className="w-1/3 h-full relative border-r border-white/5">
            <VerticalColumn images={col2} delay={2300} />
         </div>
         <div className="w-1/3 h-full relative">
            <VerticalColumn images={col3} delay={4600} />
         </div>
      </div>
    </div>
  );
});

HeroVerticalCollage.displayName = 'HeroVerticalCollage';
