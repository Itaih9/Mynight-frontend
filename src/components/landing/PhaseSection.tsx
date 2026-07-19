import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

interface PhaseSectionProps {
  phase: number;
  title: string;
  description: React.ReactNode;
  badge?: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  customVisual?: React.ReactNode;
  isReversed?: boolean;
  showActionButton?: boolean;
  hasBorder?: boolean;
  removeFrame?: boolean;
  className?: string;
  textClassName?: string;
}

const PhaseSection: React.FC<PhaseSectionProps> = ({
  phase,
  title,
  description,
  imageUrl,
  customVisual,
  isReversed = false,
  showActionButton = true,
  hasBorder = true,
  removeFrame = false,
  className = '',
  textClassName = ''
}) => {
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [hasTriggeredPulse, setHasTriggeredPulse] = useState(false);
  const navigate = useNavigate();

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { amount: 0.8, once: true });

  useEffect(() => {
    if (imageUrl) setImgSrc(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (phase === 2 && isInView && !hasTriggeredPulse) {
      setHasTriggeredPulse(true);
    }
  }, [isInView, phase, hasTriggeredPulse]);

  return (
    <section
      ref={sectionRef}
      className={`py-12 md:py-16 relative ${hasBorder ? 'border-b border-gray-50' : ''} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-14 ${isReversed ? 'lg:flex-row-reverse' : ''}`}>

          <div className={`flex-1 w-full ${textClassName}`}>
            <div className="flex flex-col items-center gap-6">

                <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={phase === 2 && hasTriggeredPulse ? {
                        scale: [1, 1.4, 1, 1.4, 1],
                        boxShadow: [
                          "0 10px 15px -3px rgba(245, 197, 24, 0.2)",
                          "0 0 40px 15px rgba(245, 197, 24, 0.5)",
                          "0 10px 15px -3px rgba(245, 197, 24, 0.2)",
                          "0 0 40px 15px rgba(245, 197, 24, 0.5)",
                          "0 10px 15px -3px rgba(245, 197, 24, 0.2)"
                        ]
                      } : {}}
                      transition={{ duration: 1.2, ease: "easeInOut", delay: 0.1 }}
                      className={`
                        shrink-0
                        inline-flex items-center justify-center w-14 h-14 rounded-full
                        bg-gold-primary brightness-105 text-white text-3xl font-bold
                        shadow-lg shadow-gold-primary/20 relative z-10
                        transition-all duration-700
                    `}>
                      {phase}
                    </motion.div>

                    <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight leading-tight text-center">
                      {title}
                    </h2>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="text-lg md:text-xl text-gray-500 leading-relaxed font-light mb-6 max-w-lg">
                      {description}
                    </div>

                    {showActionButton && (
                      <button
                        onClick={() => navigate(ROUTES.START)}
                        className="inline-flex items-center gap-2 text-black font-medium border-b-2 border-black pb-1 hover:text-gold-primary hover:border-gold-primary transition-colors"
                      >
                        <span>התחילו עכשיו</span>
                        <ArrowLeft size={18} />
                      </button>
                    )}
                </div>
            </div>
          </div>

          <div className="flex-1 w-full">
             <div className={`relative ${removeFrame ? 'rounded-3xl' : 'p-4 border border-gray-100 bg-white shadow-xl rounded-3xl'}`}>
                {customVisual ? (
                  customVisual
                ) : (
                  <div className={`aspect-[4/3] w-full overflow-hidden bg-gray-100 ${removeFrame ? 'rounded-3xl' : 'rounded-2xl'}`}>
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    )}
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PhaseSection;
