import React from 'react';

interface FloatingPhotoProps {
  src: string;
  index: number;
  total: number;
  duration: number;
  gap: number;
  flip?: boolean;
}

export const FloatingPhoto: React.FC<FloatingPhotoProps> = ({ src, index, total, duration, gap, flip }) => {
  const delay = index * -gap;

  return (
    <div
      className="absolute flow-image pointer-events-none"
      style={{
        animationName: 'ribbon-flow',
        animationDuration: `${duration}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        zIndex: total - index,
      }}
    >
      <div className="inner-shield" style={{ transform: flip ? 'scaleY(-1)' : 'none' }}>
        <img src={src} className="photo-img" alt="wedding" />
      </div>
    </div>
  );
};