import React, { useState, useEffect } from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface CelebrationButtonProps {
  onClick: () => void;
  className?: string;
  buttonClassName?: string;
  label?: string;
  fullWidth?: boolean;
  arrowStrokeWidth?: number;
  Icon?: LucideIcon;
}

export const CelebrationButton: React.FC<CelebrationButtonProps> = ({
  onClick,
  className = '',
  buttonClassName = '',
  label = 'רכישת אלבום חכם',
  fullWidth = false,
  arrowStrokeWidth = 2,
  Icon = ArrowLeft
}) => {
  const [triggerAutoShine, setTriggerAutoShine] = useState(false);

  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

    if (isTouch) {
      const interval = setInterval(() => {
        setTriggerAutoShine(true);
        setTimeout(() => setTriggerAutoShine(false), 1000);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}>

      <style>{`
        @keyframes sheen-slide {
          0% {
            left: 200%;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            left: -100%;
            opacity: 0;
          }
        }

        .sheen-effect {
          position: absolute;
          top: 0;
          left: 200%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: skewX(-25deg);
          pointer-events: none;
          z-index: 20;
        }

        .group:hover .sheen-effect {
          animation: sheen-slide 0.7s ease-in-out forwards;
        }

        .animate-sheen-mobile .sheen-effect {
          animation: sheen-slide 0.7s ease-in-out forwards;
        }
      `}</style>

      <button
        onClick={onClick}
        className={`
          group relative overflow-hidden
          bg-gradient-to-r from-gold-primary to-gold-secondary
          hover:brightness-105
          text-white
          py-4 px-10
          rounded-md rounded-tr-[20px] rounded-bl-[20px]
          text-xl font-medium
          transition-all duration-300
          flex items-center justify-center gap-4
          shadow-xl shadow-gold-secondary/20
          whitespace-nowrap
          ${fullWidth ? 'w-full' : ''}
          ${triggerAutoShine ? 'animate-sheen-mobile' : ''}
          ${buttonClassName}
        `}
      >
        <div className="sheen-effect"></div>

        <span className="-translate-x-[1px] relative z-30">{label}</span>
        <Icon size={28} strokeWidth={arrowStrokeWidth} className="relative z-30 group-hover:-translate-x-1 transition-transform duration-300" />
      </button>

    </div>
  );
};
