import React, { useEffect, useState } from 'react';

interface CelebrationButtonProps {
  onClick?: () => void;
  label: string;
  className?: string;
  buttonClassName?: string;
  textClassName?: string;
  arrowStrokeWidth?: number;
  Icon?: React.ElementType;
  style?: React.CSSProperties;
  sheenDuration?: string;
}

const LandingCelebrationButton: React.FC<CelebrationButtonProps> = ({
  onClick,
  label,
  className = "",
  buttonClassName = "",
  textClassName = "",
  arrowStrokeWidth,
  Icon,
  style,
  sheenDuration = "1.2s"
}) => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div className={`${className}`} style={style}>
      <button
        onClick={onClick}
        style={{ '--sheen-duration': sheenDuration } as React.CSSProperties}
        className={`
          relative overflow-hidden group
          bg-gradient-to-r from-[#FACD21] to-[#FAE885]
          text-white
          rounded-md rounded-tr-[20px] rounded-bl-[20px]
          shadow-[0_15px_30px_rgba(250,205,33,0.3)]
          transition-all duration-300 hover:scale-[1.02] active:scale-95
          flex items-center justify-center w-full h-full
          ${buttonClassName}
        `}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit">
           <div className="landing-sheen-element absolute top-0 left-[150%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg]" />
        </div>

        {Icon && <Icon className="relative z-10 w-[1.5em] h-[1.5em]" strokeWidth={arrowStrokeWidth} />}
        <span className={`relative z-10 drop-shadow-sm ${textClassName}`}>{label}</span>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes landing-sheen-slide-rtl {
            0% { left: 150%; }
            45% { left: -100%; }
            100% { left: -100%; }
          }
          .landing-sheen-element {
            left: 150%;
            transition: none;
          }
          .group:hover .landing-sheen-element {
            animation: landing-sheen-slide-rtl var(--sheen-duration) infinite ease-in-out;
          }
          ${isTouch ? '.group:active .landing-sheen-element { animation: landing-sheen-slide-rtl var(--sheen-duration) infinite ease-in-out; }' : ''}
        `}} />
      </button>
    </div>
  );
};

export default LandingCelebrationButton;