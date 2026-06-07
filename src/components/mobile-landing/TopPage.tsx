import React, { useState, useEffect, useRef } from 'react';
import { CelebrationButton } from './CelebrationButton';
import { ArrowDown } from 'lucide-react';
import { SplitText } from './SplitText';
import { HighlightEffect } from './utils/HighlightEffect';

const INTRO_FLOATING_IMAGES = [
  'https://i.postimg.cc/5tprJQnK/Gemini-Generated-Image-1nobub1nobub1nob.png',    // AA
  'https://i.postimg.cc/QMjzvJk9/Gemini-Generated-Image-2dz6l72dz6l72dz6.png',    // BB
  'https://i.postimg.cc/xjRcq8Vz/Gemini-Generated-Image-47dqx247dqx247dq(1).png', // MM
  'https://i.postimg.cc/vmGKCtLq/Gemini-Generated-Image-ausrwcausrwcausr(1).png', // CC
  'https://i.postimg.cc/rpqH7NC3/Gemini_Generated_Image_s3rotys3rotys3ro.png',    // DD
  'https://i.postimg.cc/7LqRjnM2/Gemini_Generated_Image_63emk763emk763em.png'     // EE
];

interface TopPageProps {
  onMoreInfoClick: () => void;
}

export const TopPage: React.FC<TopPageProps> = ({ onMoreInfoClick }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [womanSize, setWomanSize] = useState({ width: 0, height: 0 });
  const [womanRight, setWomanRight] = useState(0);

  const [activeGlows, setActiveGlows] = useState<number[]>([0, 1, 2]);
  
// Layout Debugger Config
  const [layoutConfig, setLayoutConfig] = useState({
    textTop: 58,
    textLeft: 50,
    textWidth: 100,     // Increased to 100 to prevent edge clipping
    headlineScale: 2.7, // Increased from 2.2 for a larger look
    subtextScale: 3.3,
    textSpacing: 8,
    womanLeft: 46,
    womanScale: 0.9,
    womanBottom: 85,
    headlineText: "בלילה שלכם\nאף רגע לא ישכח",
    subtextText: "מצלמים סלפי ו-My Night מוצאת את התמונות של\nכל אחד. זיכרון מושלם, אפס מאמץ."
  });

  // Measurement Tool State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{x: number, y: number} | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{x: number, y: number} | null>(null);

  const handleMeasureClick = (e: React.MouseEvent) => {
    if (!isMeasuring) return;
    
    // If we have both points, reset and start new
    if (measureStart && measureEnd) {
      setMeasureStart({ x: e.clientX, y: e.clientY });
      setMeasureEnd(null);
      return;
    }

    // If we have start, set end
    if (measureStart) {
      setMeasureEnd({ x: e.clientX, y: e.clientY });
    } else {
      // Start new measurement
      setMeasureStart({ x: e.clientX, y: e.clientY });
    }
  };

  const introRef = useRef<HTMLDivElement>(null);
  const textboxRef = useRef<HTMLDivElement>(null);
  const womanRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headlineRef.current) {
      const effect = new HighlightEffect(headlineRef.current, 0.5);
      return () => effect.destroy();
    }
  }, [layoutConfig.headlineText]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const target = entry.target as HTMLElement;
        const glowElement = target.querySelector('.glow-container');
        
        if (entry.isIntersecting) {
          if (glowElement) {
            glowElement.classList.remove('opacity-0');
            glowElement.classList.add('animate-fade-glow');
          }
        } else {
          if (glowElement) {
            glowElement.classList.remove('animate-fade-glow');
            glowElement.classList.add('opacity-0');
          }
        }
      });
    }, {
      root: null, // viewport
      threshold: 0.6, // Trigger when 60% visible
    });

    const items = document.querySelectorAll('.marquee-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [layoutConfig]); // Re-run if layout changes

  const scaleW = windowSize.width / 1920;
  const scaleH = windowSize.height / 904;
  
  const baseHeadlineSize = 99;
  const baseSubtextSize = 27;
  const baseButtonSize = 36.9; 
  const baseTargetWidth = 720; 

  useEffect(() => {
    const updateWomanStats = () => {
      if (womanRef.current) {
        // Measure the outer wrapper which has the stable positioning (no animation)
        const rect = womanRef.current.getBoundingClientRect();
        setWomanRight(rect.right);
        
        const img = womanRef.current.querySelector('img');
        if (img) {
          setWomanSize({ width: img.clientWidth, height: img.clientHeight });
        }
      }
    };
    
    // Initial call
    updateWomanStats();

    // ResizeObserver catches when image loads and container expands
    const resizeObserver = new ResizeObserver(() => {
      updateWomanStats();
    });

    if (womanRef.current) {
      resizeObserver.observe(womanRef.current);
    }

    window.addEventListener('resize', updateWomanStats);
    
    // Fallback for image load if resize observer doesn't catch it (redundancy)
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
  
  const finalScale = scaleW;

  const headlineFontSize = baseHeadlineSize * finalScale * layoutConfig.headlineScale;
  const subtextFontSize = baseSubtextSize * finalScale * layoutConfig.subtextScale;
  const buttonFontSize = (baseButtonSize * finalScale) + 4.5;
  
  const headlineMarginBottom = layoutConfig.textSpacing;
  const buttonMarginTop = (40 * scaleH) - 10;
  const scaledTopOffset = 252 * scaleH;

  // Increased width by 40% (85vw -> 119vw, 30vw -> 42vw)
  const womanWidth = '119vw';

  // Dynamic Styles based on Config (Mobile Only override)
  // Wrapper style handles positioning
  const textWrapperStyle = {
    marginTop: `${layoutConfig.textTop}px`,
    left: `${layoutConfig.textLeft}%`,
    transform: 'translateX(-50%)', // Center horizontally
    width: `${layoutConfig.textWidth}%`,
    maxWidth: '100%',
    zIndex: 30,
    position: 'relative' as const,
  };

  const womanStyle = {
    marginTop: '-38px',
    left: `${layoutConfig.womanLeft}%`,
    marginLeft: '20px',
    transform: `translateX(-50%) scale(${layoutConfig.womanScale * 1.04})`,
    transformOrigin: 'top center',
    width: 'auto',
    height: 'auto',
    position: 'relative' as const,
    zIndex: 10,
  };

  return (
    <section 
        ref={introRef} 
        id="intro" 
        className="h-auto md:h-[calc(100vh-80px)] w-full bg-[#FAFAFA] relative overflow-hidden"
        style={{ '--photo-size': 'calc(min(168px, 20vh, 13vw) + 3px)' } as React.CSSProperties}
        onClick={handleMeasureClick}
    >

        {/* Measurement Overlay */}
        {isMeasuring && (
          <div className="fixed inset-0 pointer-events-none z-[9999]">
            {measureStart && (
              <div 
                className="absolute w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                style={{ left: measureStart.x, top: measureStart.y }}
              />
            )}
            {measureEnd && (
              <div 
                className="absolute w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                style={{ left: measureEnd.x, top: measureEnd.y }}
              />
            )}
            {measureStart && measureEnd && (
              <>
                <svg className="absolute inset-0 w-full h-full">
                  <line 
                    x1={measureStart.x} 
                    y1={measureStart.y} 
                    x2={measureEnd.x} 
                    y2={measureEnd.y} 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                    strokeDasharray="4"
                  />
                </svg>
                <div 
                  className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: (measureStart.x + measureEnd.x) / 2, 
                    top: (measureStart.y + measureEnd.y) / 2 
                  }}
                >
                  {Math.round(Math.sqrt(Math.pow(measureEnd.x - measureStart.x, 2) + Math.pow(measureEnd.y - measureStart.y, 2)))}px
                </div>
              </>
            )}
          </div>
        )}
        
        <div className={`relative w-full flex flex-col`}>
            <div style={textWrapperStyle}>
              <div 
              ref={textboxRef}
              className={`text-center px-4 flex flex-col justify-center items-center overflow-hidden w-full`} 
             dir="rtl"
          >
                  <div className="flex flex-col items-center justify-center w-full max-w-full">
                  <h1 
                    ref={headlineRef}
                    className="font-black font-['Assistant'] tracking-[-0.01em] leading-[0.97] text-[#292929]"
                    style={{ 
                        fontSize: `${headlineFontSize}px`,
                        marginBottom: `${headlineMarginBottom}px`
                    }}
                  >
                      {layoutConfig.headlineText.split('\n').map((line, i) => (
                        <span key={i} className="block whitespace-nowrap">
                          <SplitText text={line} />
                        </span>
                      ))}
                  </h1>
                  <p
                    className="font-['Assistant'] text-gray-500 leading-relaxed font-normal opacity-80 mx-auto whitespace-pre-line bg-transparent"
                    style={{ fontSize: `${subtextFontSize}px` }}
                  >
                      {layoutConfig.subtextText}
                  </p>
                  </div>
              </div>
            </div>

            {/* Woman Holding Phone - Constrained to stay under navbar */}
            {/* Wrapper div for stable positioning/sizing (Ref is here) */}
            <div 
                ref={womanRef}
                className={`relative z-10 pointer-events-none select-none flex items-end justify-center`}
                style={womanStyle}
            >
                {/* Visual Distance Indicators (Mobile Only) */}
                {isMeasuring && (
                  <>
                    {/* Distance from Text to Woman (Negative Margin = Overlap) */}
                    <div className="absolute top-0 left-1/2 w-px h-[38px] bg-red-500 z-50">
                      <div className="absolute top-1/2 left-1 bg-red-500 text-white text-[10px] px-1 rounded transform -translate-y-1/2 whitespace-nowrap">
                        -38px (Overlap)
                      </div>
                    </div>

                    {/* Distance from Woman Top to Photos Top */}
                    <div className="absolute top-0 left-1/2 w-px h-[40%] bg-green-500 z-50 translate-x-[-20px]">
                      <div className="absolute top-1/2 right-1 bg-green-500 text-white text-[10px] px-1 rounded transform -translate-y-1/2 whitespace-nowrap">
                        40% (Photos Top)
                      </div>
                    </div>

                    {/* Distance from Woman Bottom to Section Bottom (Marquee Top) */}
                    <div className="absolute bottom-0 left-1/2 w-px bg-purple-500 z-50 translate-x-[20px]" 
                         style={{ 
                           height: `${Math.max(0, windowSize.height - (womanRef.current?.getBoundingClientRect().bottom || 0))}px`,
                           transform: 'translateY(100%)' 
                         }}
                    >
                      <div className="absolute top-1/2 left-1 bg-purple-500 text-white text-[10px] px-1 rounded transform -translate-y-1/2 whitespace-nowrap">
                        {Math.round(Math.max(0, windowSize.height - (womanRef.current?.getBoundingClientRect().bottom || 0)))}px (To Marquee)
                      </div>
                    </div>
                  </>
                )}

                {/* Mobile Moving Photos - Behind Woman (Inside wrapper to move with it) */}
                <>
                  {/* Fae White Glow behind woman bottom */}
                  <div 
                    className="absolute bottom-[10%] left-1/2 w-[200px] h-[200px] bg-white/60 blur-[60px] rounded-full pointer-events-none"
                    style={{ transform: 'translateX(-50%)', zIndex: -2 }}
                  />
                    
                    {/* Floating Photos */}
                    <div className="absolute left-1/2 flex items-center justify-center overflow-visible"
                        style={{
                            top: '44%',
                            width: `calc(100vw / ${layoutConfig.womanScale * 1.04})`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: -1,
                            height: '130px'
                        }}
                    >
                      <div 
                        ref={marqueeRef}
                        className="flex animate-marquee whitespace-nowrap"
                        style={{ willChange: 'transform' }}
                      >
                        {/* 
                           Seamless Loop:
                           Using 4 sets (24 images). 
                           Animating 0 -> -50% means we show 2 sets, then reset.
                           Since we have 4 sets, this is perfect.
                        */}
                        {[...INTRO_FLOATING_IMAGES, ...INTRO_FLOATING_IMAGES, ...INTRO_FLOATING_IMAGES, ...INTRO_FLOATING_IMAGES].map((src, i) => {
                          // 1 in 3 photos has glow
                          const hasGlow = i % 3 === 0;
                          
                          return (
                            <div 
                              key={i} 
                              className="marquee-item mx-2 flex-shrink-0 relative"
                              style={{
                                width: '91px',
                                height: '91px',
                                padding: '3px',
                                backgroundColor: '#f5f5f4',
                                borderRadius: '12px', // Slightly larger radius for wrapper
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                              }}
                            >
                              {hasGlow && (
                                <div className="glow-container absolute inset-0 rounded-[12px] overflow-hidden pointer-events-none z-0 opacity-0 transition-opacity duration-300">
                                    <div className="absolute inset-0" style={{ transform: 'rotate(30deg)' }}>
                                        <div 
                                          className="absolute top-1/2 left-1/2 w-[160%] h-[160%]"
                                          style={{
                                              transform: 'translate(-50%, -50%)',
                                              background: 'conic-gradient(transparent 0deg, hsla(29, 89.4%, 79.7%, 0) 280deg, hsla(29, 89.4%, 79.7%, 0.8) 330deg, hsl(29, 89.4%, 79.7%) 350deg, hsla(29, 89.4%, 79.7%, 0) 360deg)', 
                                              animation: 'tracker-spin 4s linear infinite',
                                              filter: 'blur(3.5px) brightness(1.2)'
                                          }}
                                        />
                                    </div>
                                </div>
                              )}
                              
                              <div className="w-full h-full relative z-10 bg-white rounded-[9px] overflow-hidden">
                                <img src={src} alt="" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>

                {/* Inner Image for animation */}
                <img
                 src="/images/woman-holding-phone.png"
                 alt="Woman Holding Phone"
                 loading="eager"
                 decoding="async"
                 fetchPriority="high"
                  className={`object-contain drop-shadow-[0_42px_72px_rgba(0,0,0,0.144)] pointer-events-none`}
                  style={{
                  width: 'auto',
                 height: 'auto',
                 maxWidth: womanWidth,
                 maxHeight: '99%',
                 animationDelay: '0s'
                 }}
                />
            </div>
        </div>
    </section>
  );
};