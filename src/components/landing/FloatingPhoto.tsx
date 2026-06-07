import React, { useState } from 'react';

interface FloatingPhotoProps {
  src: string;
  index: number;
  total: number;
  duration: number;
  gap: number;
}

const FloatingPhoto: React.FC<FloatingPhotoProps> = ({ src, index, total, duration, gap }) => {
  const delay = index * -gap;
  const [zIndex, setZIndex] = useState(total - index);

  const handleIteration = () => {
    setZIndex(prev => prev + total + 100);
  };

  return (
    <div
      className="absolute flow-image pointer-events-none"
      style={{
        animationName: 'ribbon-flow',
        animationDuration: `${duration}s`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}s`,
        zIndex: zIndex
      }}
      onAnimationIteration={handleIteration}
    >
      <div className="inner-shield">
        <img src={src} className="photo-img" alt="wedding" />
      </div>
    </div>
  );
};

export default FloatingPhoto;