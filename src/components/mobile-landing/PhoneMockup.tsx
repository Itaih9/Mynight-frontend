import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { WEDDING_IMAGES } from './constants';

type RowData = {
  id: number;
  left: string;
  right: string;
};

const VISIBLE_ROWS = 6;
const BUFFER_ROWS = 4;
const TOTAL_ROWS = VISIBLE_ROWS + BUFFER_ROWS;
const SPEED = 0.35;

export const PhoneMockup: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationRef = useRef<number | null>(null);
  const positionsRef = useRef<number[]>([]);
  const rowsDataRef = useRef<RowData[]>([]);
  const nextRowIdRef = useRef(0);
  const nextImageIndexRef = useRef(0);
  const rowHeightRef = useRef(0);
  const totalTrackHeightRef = useRef(0);
  const initializedRef = useRef(false);

  const getNextImage = () => {
    const image = WEDDING_IMAGES[nextImageIndexRef.current % WEDDING_IMAGES.length];
    nextImageIndexRef.current += 1;
    return image;
  };

  const getNextRowData = (): RowData => {
    return {
      id: nextRowIdRef.current++,
      left: getNextImage(),
      right: getNextImage(),
    };
  };

  const applyRowContent = (rowEl: HTMLDivElement, data: RowData) => {
    const leftImg = rowEl.querySelector('[data-side="left"] img') as HTMLImageElement | null;
    const rightImg = rowEl.querySelector('[data-side="right"] img') as HTMLImageElement | null;

    if (leftImg) leftImg.src = data.left;
    if (rightImg) rightImg.src = data.right;
  };

  const applyPositions = () => {
    rowRefs.current.forEach((row, index) => {
      if (!row) return;
      row.style.transform = `translateY(${positionsRef.current[index]}px)`;
    });
  };

  const measureLayout = () => {
    const first = rowRefs.current[0];
    const second = rowRefs.current[1];

    if (!first || !second) return;

    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();
    const height = secondRect.top - firstRect.top;

    if (height > 0) {
      rowHeightRef.current = height;
      totalTrackHeightRef.current = height * TOTAL_ROWS;
    }
  };

  useLayoutEffect(() => {
    if (initializedRef.current) return;

    rowsDataRef.current = Array.from({ length: TOTAL_ROWS }, () => getNextRowData());
    positionsRef.current = Array.from({ length: TOTAL_ROWS }, (_, i) => i * 130);

    initializedRef.current = true;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      measureLayout();

      if (!rowHeightRef.current) return;

      positionsRef.current = Array.from(
        { length: TOTAL_ROWS },
        (_, i) => i * rowHeightRef.current
      );

      rowRefs.current.forEach((row, index) => {
        if (!row) return;
        applyRowContent(row, rowsDataRef.current[index]);
      });

      applyPositions();

      const animate = () => {
        if (!rowHeightRef.current || !totalTrackHeightRef.current) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        for (let i = 0; i < positionsRef.current.length; i++) {
          positionsRef.current[i] -= SPEED;
        }

        for (let i = 0; i < positionsRef.current.length; i++) {
          if (positionsRef.current[i] <= -rowHeightRef.current) {
            positionsRef.current[i] += totalTrackHeightRef.current;
            rowsDataRef.current[i] = getNextRowData();

            const rowEl = rowRefs.current[i];
            if (rowEl) {
              applyRowContent(rowEl, rowsDataRef.current[i]);
            }
          }
        }

        applyPositions();
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }, 50);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative w-[280px] h-[568px] sm:w-[320px] sm:h-[650px] transform-gpu">
      <img
        src="/images/phone-mockup.png"
        className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-[0_30px_30px_rgba(0,0,0,0.25)]"
        alt="Phone Frame"
      />

      <div className="absolute -top-[2px] left-[0%] right-[2%] bottom-[1.5%] z-50 pointer-events-none">
        <div
          className="absolute top-[110px] left-[12px] right-[15px] h-8"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-[59px] left-[13px] right-[15px] h-10"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.17) 0%, transparent 100%)',
          }}
        />
      </div>

      <div className="absolute -top-[3px] left-[7.5%] right-[7.5%] bottom-[1.5%] rounded-[35px] overflow-hidden z-20">
        <div
          className="absolute inset-0 px-3"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0px, transparent 113px, black 113px, black calc(100% - 59px), transparent calc(100% - 59px))',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0px, transparent 113px, black 113px, black calc(100% - 59px), transparent calc(100% - 59px))',
          }}
        >
          <div
            ref={containerRef}
            className="relative w-full h-full"
          >
            {Array.from({ length: TOTAL_ROWS }).map((_, index) => (
              <div
                key={index}
                ref={el => {
                  rowRefs.current[index] = el;
                }}
                className="absolute left-0 w-full grid grid-cols-2 gap-3 will-change-transform"
                style={{ transform: `translateY(${index * 130}px)` }}
              >
                <div
                  data-side="left"
                  className="aspect-square bg-stone-50 rounded-lg overflow-hidden border border-stone-100"
                  style={{ boxShadow: '0 0 5px 1px rgba(219, 199, 83, 0.25)' }}
                >
                  <img
                    src={rowsDataRef.current[index]?.left}
                    className="w-full h-full object-cover"
                    alt="feed-left"
                    draggable={false}
                  />
                </div>

                <div
                  data-side="right"
                  className="aspect-square bg-stone-50 rounded-lg overflow-hidden border border-stone-100"
                  style={{ boxShadow: '0 0 5px 1px rgba(219, 199, 83, 0.25)' }}
                >
                  <img
                    src={rowsDataRef.current[index]?.right}
                    className="w-full h-full object-cover"
                    alt="feed-right"
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;