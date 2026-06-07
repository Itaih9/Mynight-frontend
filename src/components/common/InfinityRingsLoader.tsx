import React from 'react';
import { motion } from 'framer-motion';

interface InfinityRingsLoaderProps {
  size?: number;
  className?: string;
  complete?: boolean;
  variant?: 'dark' | 'light' | 'gold';
}

const InfinityRingsLoader: React.FC<InfinityRingsLoaderProps> = ({
  size = 120,
  className = "",
  complete = false,
  variant = 'dark'
}) => {

  const getColor = () => {
    switch(variant) {
      case 'light': return '#ffffff';
      case 'gold': return '#F5C518';
      case 'dark':
      default: return '#111111';
    }
  };

  const color = getColor();
  const circleCount = 16;
  const radius = 40;
  const dotRadius = 5;

  const circles = Array.from({ length: circleCount }).map((_, i) => {
    const angle = (i * 360) / circleCount;
    const radian = (angle - 90) * (Math.PI / 180);

    const cx = 50 + radius * Math.cos(radian);
    const cy = 50 + radius * Math.sin(radian);

    const opacity = (i + 1) / circleCount;

    return { cx, cy, opacity };
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>

      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible"
        initial={{ rotate: 0 }}
        animate={complete
          ? { opacity: 0, scale: 0.9 }
          : { opacity: 1, scale: 1, rotate: 360 }
        }
        transition={complete
          ? { duration: 0.4 }
          : {
              rotate: { duration: 2.9, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }
        }
      >
        {circles.map((circle, index) => (
          <circle
            key={index}
            cx={circle.cx}
            cy={circle.cy}
            r={dotRadius}
            fill={color}
            opacity={circle.opacity}
          />
        ))}
      </motion.svg>

      {complete && (
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 50 50"
          className="overflow-visible relative z-10"
        >
           <motion.path
              d="M10 25 L22 37 L40 13"
              fill="none"
              stroke={variant === 'light' ? '#ffffff' : '#F5C518'}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          />
        </svg>
      )}
    </div>
  );
};

export default InfinityRingsLoader;
