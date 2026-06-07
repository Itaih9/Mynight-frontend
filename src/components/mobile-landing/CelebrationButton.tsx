import React, { useEffect, useState } from 'react';

interface CelebrationButtonProps {
  onClick?: () => void;
  label: string;
  className?: string;
  buttonClassName?: string;
  textClassName?: string;
  iconClassName?: string;
  arrowStrokeWidth?: number;
  Icon?: React.ElementType;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  sheenDuration?: string;
}

export const CelebrationButton: React.FC<CelebrationButtonProps> = ({
  onClick,
  label,
  className = "",
  buttonClassName = "",
  textClassName = "",
  iconClassName = "",
  arrowStrokeWidth,
  Icon,
  style,
  buttonStyle,
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
        style={{ 
          '--sheen-duration': sheenDuration,
          ...buttonStyle
        } as React.CSSProperties}
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
        {/* Sheen effect wrapper */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit">
           <div className="sheen-element absolute top-0 left-[150%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg]" />
        </div>

        {Icon && <Icon className={`relative z-10 w-[1.5em] h-[1.5em] ${iconClassName}`} strokeWidth={arrowStrokeWidth} />}
        <span className={`relative z-10 drop-shadow-sm ${textClassName}`}>{label}</span>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes sheen-slide-rtl {
            0% { left: 150%; }
            45% { left: -100%; }
            100% { left: -100%; }
          }
          .sheen-element {
            left: 150%;
            transition: none;
          }
          .group:hover .sheen-element {
            animation: sheen-slide-rtl var(--sheen-duration) infinite ease-in-out;
          }
          ${isTouch ? '.group:active .sheen-element { animation: sheen-slide-rtl var(--sheen-duration) infinite ease-in-out; }' : ''}
        `}} />
      </button>
    </div>
  );
};