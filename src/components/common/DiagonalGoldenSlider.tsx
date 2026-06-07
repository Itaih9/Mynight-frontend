import React, { useState, useRef, useEffect } from 'react';

interface DiagonalGoldenSliderProps {
  leftImage: string;
  rightImage: string;
  className?: string;
  startOffset?: number;
}

const DiagonalGoldenSlider: React.FC<DiagonalGoldenSliderProps> = ({
  leftImage,
  rightImage,
  className = '',
  startOffset = 0
}) => {
  const [sliderPosition, setSliderPosition] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  const slant = 15;

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      const baseFactor = isMobile ? 0.70 : 0.55;
      const startFactor = baseFactor + startOffset;

      const startPoint = windowHeight * startFactor;
      const endPoint = windowHeight * 0.15;
      const totalDistance = startPoint - endPoint;
      const scrolled = startPoint - rect.top;
      let progress = scrolled / totalDistance;
      progress = Math.max(0, Math.min(1, progress));
      setSliderPosition(100 - (progress * 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
    };
  }, [startOffset]);

  const lineX1 = sliderPosition + (slant * 1.1);
  const lineX2 = sliderPosition - (slant * 1.1);

  const containerClass = className.includes('rounded')
    ? className
    : `rounded-xl ${className}`;

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-5xl mx-auto aspect-[4/3] relative overflow-hidden bg-white transform translate-z-0 ${containerClass}`}
    >
      <img
        src={rightImage}
        alt="Right Side"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div
        className="absolute inset-0 w-full h-full bg-white will-change-[clip-path]"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition + slant}% 0, ${sliderPosition - slant}% 100%, 0% 100%)`
        }}
      >
        <img
          src={leftImage}
          alt="Left Side"
          className="w-full h-full object-cover"
        />
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <line
          x1={`${lineX1}%`}
          y1="-5%"
          x2={`${lineX2}%`}
          y2="105%"
          stroke="#F5C518"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

export default DiagonalGoldenSlider;
