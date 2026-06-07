import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { WEDDING_IMAGES } from './constants';

const PhoneMockup: React.FC = () => {
  const [feed, setFeed] = useState<{id: number, src: string}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollY = useRef(0);
  const isUpdating = useRef(false);
  const nextId = useRef(0);
  const imageIndexRef = useRef(WEDDING_IMAGES.length - 1);
  const rowHeightRef = useRef(130);

  const getNextPair = () => {
    const firstIndex = imageIndexRef.current;
    let secondIndex = imageIndexRef.current - 1;
    if (secondIndex < 0) secondIndex = WEDDING_IMAGES.length - 1;
    imageIndexRef.current -= 2;
    if (imageIndexRef.current < 0) imageIndexRef.current += WEDDING_IMAGES.length;
    return [
        { id: nextId.current++, src: WEDDING_IMAGES[firstIndex] },
        { id: nextId.current++, src: WEDDING_IMAGES[secondIndex] }
    ];
  };

  useEffect(() => {
    const initialItems: {id: number, src: string}[] = [];
    for(let i=0; i<8; i++) { initialItems.push(...getNextPair()); }
    setFeed(initialItems);
  }, []);

  useEffect(() => {
    const measureRowHeight = () => {
      if (containerRef.current) {
        const items = containerRef.current.children;
        if (items.length >= 3) {
          const firstRect = (items[0] as HTMLElement).getBoundingClientRect();
          const thirdRect = (items[2] as HTMLElement).getBoundingClientRect();
          const measured = thirdRect.top - firstRect.top;
          if (measured > 0) rowHeightRef.current = measured;
        }
      }
    };
    measureRowHeight();
  }, [feed]);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      scrollY.current -= 0.6;
      if (scrollY.current <= -rowHeightRef.current && !isUpdating.current) {
        isUpdating.current = true;
        setFeed(prev => [...prev.slice(2), ...getNextPair()]);
      }
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${scrollY.current}px) translateX(-2px)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useLayoutEffect(() => {
    if (isUpdating.current) {
        scrollY.current += rowHeightRef.current;
        if (containerRef.current) {
            containerRef.current.style.transform = `translateY(${scrollY.current}px) translateX(-2px)`;
        }
        isUpdating.current = false;
    }
  }, [feed]);

  return (
    <div className="relative w-[280px] h-[568px] sm:w-[320px] sm:h-[650px] transform-gpu">
      <img
        src="/images/phone-mockup.png"
        className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-[0_30px_30px_rgba(0,0,0,0.25)]"
        alt="Phone Frame"
      />

      <div className="absolute top-[2%] left-[0%] right-[2%] bottom-[3%] z-50 pointer-events-none">
        <div
          className="absolute top-[110px] left-[12px] right-[15px] h-8"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%)' }}
        />
        <div
          className="absolute bottom-[59px] left-[13px] right-[15px] h-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.17) 0%, transparent 100%)' }}
        />
      </div>

      <div className="absolute top-[2%] left-[7.5%] right-[7.5%] bottom-[3%] rounded-[35px] overflow-hidden z-20 flex flex-col">
        <div
            className="absolute inset-0 flex flex-col justify-end px-3"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 113px, black 113px, black calc(100% - 59px), transparent calc(100% - 59px))',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, transparent 113px, black 113px, black calc(100% - 59px), transparent calc(100% - 59px))'
            }}
        >
            <div
              ref={containerRef}
              className="grid grid-cols-2 gap-3 pb-4 will-change-transform"
              style={{ transform: `translateY(0px) translateX(-2px)` }}
            >
                {feed.map((item, i) => {
                    const isLeft = i % 2 === 0;

                    return (
                      <div
                          key={item.id}
                          className="animate-slide-up"
                          style={{ animationDelay: isLeft ? '1s' : '0s' }}
                      >
                          <div
                              className="aspect-square bg-stone-50 rounded-lg overflow-hidden border border-stone-100"
                              style={{ boxShadow: '0 0 5px 1px rgba(219, 199, 83, 0.25)' }}
                          >
                              <img src={item.src} className="w-full h-full object-cover" alt="feed" />
                          </div>
                      </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;