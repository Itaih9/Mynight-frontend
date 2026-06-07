import React, { useState, useEffect, useRef } from 'react';
import LandingCelebrationButton from './CelebrationButton';
import { ArrowDown } from 'lucide-react';

const INTRO_FLOATING_IMAGES = [
  'https://i.postimg.cc/5tprJQnK/Gemini-Generated-Image-1nobub1nobub1nob.png',
  'https://i.postimg.cc/QMjzvJk9/Gemini-Generated-Image-2dz6l72dz6l72dz6.png',
  'https://i.postimg.cc/xjRcq8Vz/Gemini-Generated-Image-47dqx247dqx247dq(1).png',
  'https://i.postimg.cc/vmGKCtLq/Gemini-Generated-Image-ausrwcausrwcausr(1).png',
  'https://i.postimg.cc/rpqH7NC3/Gemini_Generated_Image_s3rotys3rotys3ro.png',
  'https://i.postimg.cc/7LqRjnM2/Gemini_Generated_Image_63emk763emk763em.png'
];

const PHOTO_CODES = ['AA', 'BB', 'MM', 'CC', 'DD', 'EE'];

const INITIAL_PHOTO_POSITIONS = [
  { top: 'calc(55vh - 66px + var(--photo-size) + 12px)', left: 'calc(22vw - 46px - (var(--photo-size) * 0.5) - 6px)', rot: 0 },
  { top: 'calc(55vh - 66px - var(--photo-size) - 12px)', left: 'calc(22vw - 46px + (var(--photo-size) * 0.5) + 6px)', rot: 0 },
  { top: 'calc(55vh - 66px)', left: 'calc(22vw - 46px + (var(--photo-size) * 0.5) + 6px - 2vw)', rot: 0 },
  { top: 'calc(55vh - 66px)', left: 'calc(22vw - 46px - (var(--photo-size) * 0.5) - 6px - 2vw)', rot: 0 },
  { top: 'calc(55vh - 66px + var(--photo-size) + 12px)', left: 'calc(22vw - 46px + (var(--photo-size) * 0.5) + 6px)', rot: 0 },
  { top: 'calc(55vh - 66px - var(--photo-size) - 12px)', left: 'calc(22vw - 46px - (var(--photo-size) * 0.5) - 6px)', rot: 0 }
];

const CALCULATED_ENTRANCE_DELAYS = [4.5, 3.4, 2.7, 5.1, 4.2, 3.1];

interface TopPageProps {
  onMoreInfoClick: () => void;
}

const TopPage: React.FC<TopPageProps> = ({ onMoreInfoClick }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [womanRight, setWomanRight] = useState(0);

  const subtext = <>תגידו ביי לחיפושים של שעות. האורחים מקבלים לינק אישי, מצלמים סלפי, ו-My Night מוצאת את כל התמונות שלהם. <span className="whitespace-nowrap">זיכרון מושלם, אפס מאמץ.</span></>;

  const [positions] = useState(INITIAL_PHOTO_POSITIONS.map((p, i) => ({ ...p, code: PHOTO_CODES[i] })));
  const [womanPosition] = useState({ bottom: '0px', left: 'calc(54% - 53px)' });
  const [activeGlows, setActiveGlows] = useState<number[]>([0, 1, 2]);

  const introRef = useRef<HTMLDivElement>(null);
  const textboxRef = useRef<HTMLDivElement>(null);
  const womanRef = useRef<HTMLDivElement>(null);

  const scaleW = windowSize.width / 1920;
  const scaleH = windowSize.height / 904;

  const baseHeadlineSize = 99;
  const baseSubtextSize = 27;
  const baseButtonSize = 36.9;
  const baseTargetWidth = 720;

  useEffect(() => {
    const updateWomanStats = () => {
      if (womanRef.current) {
        const rect = womanRef.current.getBoundingClientRect();
        setWomanRight(rect.right);
      }
    };

    updateWomanStats();

    const resizeObserver = new ResizeObserver(() => {
      updateWomanStats();
    });

    if (womanRef.current) {
      resizeObserver.observe(womanRef.current);
    }

    window.addEventListener('resize', updateWomanStats);

    const img = womanRef.current?.querySelector('img');
    if (img) {
      if (img.complete) updateWomanStats();
      else img.onload = updateWomanStats;
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWomanStats);
    };
  }, [windowSize]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGlows(prev => {
        const nextStart = (prev[0] + 1) % 6;
        return [nextStart, (nextStart + 1) % 6, (nextStart + 2) % 6];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const minTextLeft = womanRight - 67;
  const maxTextRight = windowSize.width - 47;
  const availableWidth = Math.max(0, maxTextRight - minTextLeft);

  const proportionalTargetWidth = baseTargetWidth * scaleW;

  const rawSizeFitScale = (availableWidth < proportionalTargetWidth && availableWidth > 0) ? availableWidth / proportionalTargetWidth : 1;
  const sizeFitScale = 1 - ((1 - rawSizeFitScale) * 0.85);
  const finalScale = scaleW * sizeFitScale;

  const headlineFontSize = baseHeadlineSize * finalScale;
  const subtextFontSize = baseSubtextSize * finalScale;
  const buttonFontSize = (baseButtonSize * finalScale) + 4.5;

  const headlineMarginBottom = 12 * scaleH;
  const buttonMarginTop = (40 * scaleH) - 10;
  const scaledTopOffset = 252 * scaleH;

  const isMobile = windowSize.width < 1024;
  const womanWidth = isMobile ? '119vw' : '42vw';

  const mobileHeadlineSize = Math.max(38, Math.min(56, windowSize.width * 0.125));
  const mobileSubtextSize = Math.max(15, Math.min(19, windowSize.width * 0.043));
  const mobileButtonSize = Math.max(18, Math.min(24, windowSize.width * 0.055));

  const finalHeadlineSize = isMobile ? mobileHeadlineSize : headlineFontSize;
  const finalSubtextSize = isMobile ? mobileSubtextSize : subtextFontSize;
  const finalButtonSize = isMobile ? mobileButtonSize : buttonFontSize;
  const finalHeadlineMargin = isMobile ? 10 : headlineMarginBottom;
  const finalButtonMargin = isMobile ? 20 : buttonMarginTop;

  return (
    <section
        ref={introRef}
        id="intro"
        className="h-[calc(100vh-80px)] w-full bg-[#FAFAFA] relative overflow-hidden"
        style={{ '--photo-size': 'calc(min(168px, 20vh, 13vw) + 3px)' } as React.CSSProperties}
    >
        <div className="sticky top-0 h-full w-full">
            <div
              ref={textboxRef}
              className="absolute z-[30] text-center px-4 animate-fade-in-up flex flex-col justify-center items-center overflow-hidden"
              dir="rtl"
              style={isMobile ? {
                animationDelay: '1.5s',
                top: '6%',
                left: '20px',
                right: '20px',
              } : {
                animationDelay: '1.5s',
                top: `calc(50% - ${scaledTopOffset}px - 8px)`,
                right: '47px',
                left: `${minTextLeft}px`,
                transform: 'translateY(-50%)',
                maxWidth: `${proportionalTargetWidth}px`,
                marginRight: '0',
                marginLeft: 'auto'
              }}
            >
                <div className="flex flex-col items-center justify-center w-full max-w-full">
                  <h1
                    className="font-black font-['Assistant'] tracking-[-0.01em] leading-[0.97] whitespace-pre-line text-[#292929]"
                    style={{
                        fontSize: `${finalHeadlineSize}px`,
                        marginBottom: `${finalHeadlineMargin}px`
                    }}
                  >
                      בלילה שלכם
                      {'\n'}
                      <span className="whitespace-nowrap">אף רגע לא ישכח</span>
                  </h1>
                  <p
                    className="font-['Assistant'] text-gray-500 leading-relaxed font-light opacity-80 mx-auto whitespace-pre-line bg-transparent"
                    style={{ fontSize: `${finalSubtextSize}px` }}
                  >
                      {subtext}
                  </p>
                  <div
                    className="flex justify-center"
                    style={{ marginTop: `${finalButtonMargin}px` }}
                  >
                      <LandingCelebrationButton
                          label="לחבילה החכמה"
                          onClick={onMoreInfoClick}
                          buttonClassName="py-[0.5em] px-[1.5em] font-['Assistant'] font-bold tracking-[0.015em] !shadow-none flex-row-reverse gap-[0.5em]"
                          style={{ fontSize: `${finalButtonSize}px` }}
                          Icon={ArrowDown}
                          arrowStrokeWidth={3}
                      />
                  </div>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-20 hidden lg:block">
              {INTRO_FLOATING_IMAGES.map((src, i) => {
                const pos = positions[i];
                const entranceDelay = CALCULATED_ENTRANCE_DELAYS[i];
                const size = 'var(--photo-size)';

                return (
                  <div
                    key={i}
                    className="absolute photo-entrance-wrapper pointer-events-none group"
                    style={{
                      width: size,
                      height: size,
                      top: pos.top,
                      left: pos.left,
                      transform: `translate(-50%, -50%)`,
                      animation: `photo-entrance 4s cubic-bezier(0.19, 1, 0.22, 1) forwards`,
                      animationDelay: `${entranceDelay}s`,
                      opacity: 0,
                    } as React.CSSProperties}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        animationName: 'breathing',
                        animationDuration: `${(5 + (i % 3)) * 2}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDelay: `${6 + (i * 0.1)}s`
                      }}
                    >
                      <div
                        className="w-full h-full relative"
                        style={{
                          animation: 'none',
                          borderRadius: '18.4px',
                          padding: '4.2px',
                          backgroundColor: '#f5f5f4',
                          boxShadow: '0 7.2px 14.4px rgba(0,0,0,0.12)',
                          transition: 'box-shadow 0.2s ease'
                        } as React.CSSProperties}
                      >
                        <div
                          className={`absolute inset-0 rounded-[18.4px] overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ease-in-out ${activeGlows.includes(i) ? 'opacity-100' : 'opacity-0'}`}
                          style={{ animationDelay: `${entranceDelay + 4.5}s` }}
                        >
                            <div className="absolute inset-0" style={{ transform: `rotate(${i * 60 + 30}deg)` }}>
                                <div
                                    className="absolute top-1/2 left-1/2 w-[160%] h-[160%]"
                                    style={{
                                        transform: 'translate(-50%, -50%)',
                                        background: 'conic-gradient(transparent 0deg, hsla(29, 89.4%, 79.7%, 0) 280deg, hsla(29, 89.4%, 79.7%, 0.8) 330deg, hsl(29, 89.4%, 79.7%) 350deg, hsla(29, 89.4%, 79.7%, 0) 360deg)',
                                        animation: `tracker-spin ${12 + (i % 3) * 3}s linear infinite`,
                                        animationDelay: `${-(i * 3.5) + (i * 0.5)}s`,
                                        filter: 'blur(3.5px) brightness(1.2)'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="w-full h-full relative z-10 overflow-hidden select-none bg-white" style={{ borderRadius: '15.2px' }}>
                          <img
                            src={src}
                            className="w-full h-full object-cover pointer-events-none"
                            alt="floating context"
                            style={{ filter: 'contrast(0.9)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
                ref={womanRef}
                className="absolute z-10 pointer-events-none select-none flex items-end justify-center"
                style={{
                    bottom: '0',
                    left: womanPosition.left,
                    transform: 'translate(-50%, 0)',
                    width: 'auto',
                    height: 'auto'
                }}
            >
                <img
                    src="/images/woman-holding-phone.png"
                    alt="Woman Holding Phone"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="object-contain drop-shadow-[0_42px_72px_rgba(0,0,0,0.144)] pointer-events-none animate-fade-in-up"
                    style={{
                        width: 'auto',
                        height: 'auto',
                        maxWidth: womanWidth,
                        maxHeight: '99%',
                        animationDelay: '0.5s'
                    }}
                />
            </div>
        </div>
      </section>
  );
};

export default TopPage;