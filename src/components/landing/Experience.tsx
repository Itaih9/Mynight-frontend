import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDown } from 'lucide-react';
import LandingCelebrationButton from './CelebrationButton';
import PhoneMockup from './PhoneMockup';
import FloatingPhoto from './FloatingPhoto';
import { WEDDING_IMAGES } from './constants';

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" strokeWidth="inherit" />
    <circle cx="12" cy="12" r="3" strokeWidth="inherit" />
  </svg>
);

interface ExperienceProps {
  onMoreInfoClick: () => void;
  onGiantClick: () => void;
}

const Experience: React.FC<ExperienceProps> = ({ onMoreInfoClick, onGiantClick }) => {
  const [pathData, setPathData] = useState({ d: "", length: 0 });
  const sectionRef = React.useRef<HTMLElement>(null);
  const [sectionSize, setSectionSize] = useState({ width: 0, height: 0 });
  const [anchorY] = useState(241);

  const IMG_WIDTH = 100;
  const VISUAL_GAP = 13;
  const DESIRED_UNIT = IMG_WIDTH + VISUAL_GAP;
  const SPEED_PX_PER_SEC = 30.25;

  useEffect(() => {
    if (!sectionRef.current) return;

    const updateSize = () => {
      if (sectionRef.current) {
        const { width, height } = sectionRef.current.getBoundingClientRect();
        setSectionSize(prev => {
          if (prev.width !== width || Math.abs(prev.height - height) > 150) {
            return { width, height };
          }
          return prev;
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (sectionSize.width === 0 || sectionSize.height === 0) return;

    const updatePath = () => {
      const w = sectionSize.width;
      const h = sectionSize.height;
      const section = sectionRef.current;

      let startX = w * 1.5;
      let startY = anchorY;
      let endX = w * 0.1;
      let endY = h * 0.45 - 40;

      const phoneContainer = document.getElementById('phone-mockup-container');

      if (phoneContainer && section) {
        const phoneRect = phoneContainer.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();

        const phoneCenterX = phoneRect.left + phoneRect.width / 2 - sectionRect.left;
        const phoneCenterY = phoneRect.top + phoneRect.height / 2 - sectionRect.top;

        endX = phoneCenterX - 25;
        endY = phoneCenterY + 2;
        startY = endY;
        startX = endX + 1500;
      } else {
         startX = w * 1.5;
      }

      const controlX = w * 0.7 + 30;
      let controlY = h * 1.25 - 10;

      const btn = document.getElementById('giant-cta-container');

      if (btn && section) {
        btn.style.marginTop = '';

        const btnRect = btn.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();

        const btnTopRelative = btnRect.top - sectionRect.top;
        const targetMaxY = btnTopRelative - 140;

        const calculateMaxY = (cy: number) => {
          const denom = startY - 2 * cy + endY;
          if (Math.abs(denom) < 0.001) return Math.max(startY, endY);

          const t = (startY - cy) / denom;
          if (t < 0 || t > 1) return Math.max(startY, endY);

          const mt = 1 - t;
          return (mt * mt * startY) + (2 * mt * t * cy) + (t * t * endY);
        };

        const defaultMaxY = calculateMaxY(controlY);

        if (defaultMaxY > targetMaxY) {
          let low = -h;
          let high = controlY;

          for (let i = 0; i < 20; i++) {
            const mid = (low + high) / 2;
            const my = calculateMaxY(mid);

            if (my > targetMaxY) {
              high = mid;
            } else {
              low = mid;
            }
          }
          controlY = low;
        }
      }

      const d = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("d", d);
      const len = pathEl.getTotalLength();

      setPathData({ d: `path("${d}")`, length: len });
    };

    updatePath();

  }, [sectionSize, anchorY]);

  const { floatingImages, duration, gap } = useMemo(() => {
    if (pathData.length === 0) return { floatingImages: [] as string[], duration: 0, gap: 0 };

    const count = Math.max(1, Math.ceil(pathData.length / DESIRED_UNIT));
    const totalDuration = pathData.length / SPEED_PX_PER_SEC;
    const singleGapDuration = totalDuration / count;

    let images: string[] = [];
    while (images.length < count) {
      images = [...images, ...WEDDING_IMAGES];
    }
    images = images.slice(0, count);

    return {
      floatingImages: images,
      duration: totalDuration,
      gap: singleGapDuration
    };
  }, [pathData.length, DESIRED_UNIT, SPEED_PX_PER_SEC]);

  const baseButtonSize = 36.9;
  const scaleW = sectionSize.width / 1920;
  const buttonFontSize = (((baseButtonSize * scaleW) + 4.5) * 1.08 * 0.8) + 2.7;

  return (
      <section
        id="experience"
        ref={sectionRef}
        className="relative z-[300] min-h-screen flex flex-col items-center overflow-hidden bg-[#EDEDED] pt-6 lg:pt-[52px] pb-0 rounded-b-[40px] lg:rounded-b-[80px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(225,29,72,0.03)_0%,transparent_50%)]" />

        <div className="w-full flex-grow flex flex-col justify-center">
            <div className="w-full px-4 md:px-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-20 transform translate-y-0 relative z-20">
              <div id="phone-mockup-container" className="relative z-[200] w-[280px] sm:w-[320px] mx-auto">
                <PhoneMockup />
              </div>

              <div className="relative z-[210] max-w-4xl text-center mx-auto lg:translate-x-[calc(70px_-_12.5vw)] lg:-translate-y-[90px]" dir="rtl">
                <h1 className="mb-3 lg:mb-5 relative z-20 text-[36px] sm:text-[48px] md:text-[77px] font-black leading-[1.1] tracking-tight font-['Assistant'] rounded-lg whitespace-pre-line text-[#292929]">
                  בלילה שלכם
                  {'\n'}
                  <span className="whitespace-nowrap">אל תפספסו שניה אחת</span>
                </h1>
                <p className="mb-4 lg:mb-6 relative z-20 text-[16px] sm:text-[18px] md:text-[24px] text-gray-500 leading-relaxed font-light font-['Assistant'] opacity-80 max-w-2xl mx-auto rounded-lg whitespace-pre-line bg-transparent transform -translate-y-[10px]">
                  במקום לרדוף אחרי תמונות בווצאפ – המערכת שלנו אוספת עבורכם את כל התמונות והסרטונים מהאורחים למקום אחד ובאיכות הגבוהה ביותר,
                  <span className="whitespace-nowrap"> כבר בבוקר שאחרי.</span>
                </p>
                <div className="inline-flex flex-col items-center gap-4 pt-2 -translate-y-[14px] relative z-10 w-full justify-center">
                    <LandingCelebrationButton
                      onClick={onMoreInfoClick}
                      label="לחבילה האוספת"
                      className="w-auto flex justify-center"
                      buttonClassName="py-[0.5em] px-[1.5em] font-['Assistant'] font-bold tracking-[0.015em] !shadow-none flex-row-reverse gap-[0.5em]"
                      textClassName="-translate-y-[2px]"
                      style={{ fontSize: `${buttonFontSize}px` }}
                      arrowStrokeWidth={3}
                      Icon={ArrowDown}
                    />
                </div>
              </div>
            </div>
        </div>

        <div id="giant-cta-container" className="relative z-[250] mt-10 lg:mt-24 mb-6 lg:mb-12 w-full flex justify-center px-4 md:px-6">
            <LandingCelebrationButton
                onClick={onGiantClick}
                label="איך זה נראה"
                sheenDuration="1.7s"
                className="w-auto flex justify-center"
                buttonClassName="!text-[42px] sm:!text-[56px] md:!text-[72px] lg:!text-[88px] xl:!text-[100px] font-['Assistant'] font-extrabold !gap-[16px] md:!gap-[32px] pt-2 pb-[10px] md:pt-6 md:pb-[28px] px-[24px] sm:px-[36px] md:px-[78px] w-auto max-w-none tracking-[0.05em] [-webkit-text-stroke:1px_white] sm:[-webkit-text-stroke:2px_white] md:[-webkit-text-stroke:3px_white] !from-[#616161] !to-[#0f0f0f] !shadow-none !rounded-t-none !rounded-b-[18px] sm:!rounded-b-[29px] md:!rounded-b-[69px]"
                textClassName="-translate-y-[4px]"
                Icon={Eye}
            />
        </div>

        <div
          className="flow-container transform translate-y-0"
          style={{
            '--wedding-path': pathData.d,
            zIndex: 10
          } as React.CSSProperties}
        >
          {floatingImages.map((src, i) => (
            <FloatingPhoto
              key={i}
              src={src}
              index={i}
              total={floatingImages.length}
              duration={duration}
              gap={gap}
            />
          ))}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ribbon-flow {
            0% { offset-distance: 0%; }
            100% { offset-distance: 100%; }
          }
          .flow-container {
            position: absolute;
            inset: 0;
            z-index: 50;
            pointer-events: none;
          }
          .flow-image {
            position: absolute;
            width: 100px;
            height: 100px;
            background: white;
            border: 4px solid white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            offset-path: var(--wedding-path);
            offset-rotate: auto 180deg;
            will-change: offset-distance;
          }
          .inner-shield {
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 12px;
          }
          .photo-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        `}} />
      </section>
  );
};

export default Experience;