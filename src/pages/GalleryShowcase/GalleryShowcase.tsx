import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { motion, AnimatePresence } from 'framer-motion';
import Gallery from '../Gallery/Gallery';

const GalleryShowcase: React.FC = () => {
  const navigate = useNavigate();

  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const [showGiantCta, setShowGiantCta] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.8;
      const shouldShow = window.scrollY > threshold;
      setIsPastThreshold(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPastThreshold) {
        timer = setTimeout(() => {
            setShowGiantCta(true);
        }, 2000);
    } else {
        setShowGiantCta(false);
    }
    return () => clearTimeout(timer);
  }, [isPastThreshold]);

  useEffect(() => {
    if (showGiantCta) {
      const timer = setTimeout(() => setShowSubtitle(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setShowSubtitle(false);
    }
  }, [showGiantCta]);

  const handleCtaClick = () => {
    navigate('/#packages');
  };

  return (
    <>
      <Gallery isOwner={false} isShowcase />

      <AnimatePresence>
        {showGiantCta && (
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="fixed bottom-0 left-0 right-0 z-[100] p-0 w-full"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <style>{`
                  @keyframes sheen-slide {
                    0% { left: 200%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { left: -100%; opacity: 0; }
                  }
                  .sheen-effect {
                    position: absolute; top: 0; left: 200%; width: 50%; height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
                    transform: skewX(-25deg); pointer-events: none; z-index: 20;
                  }
                  .giant-btn:hover .sheen-effect {
                    animation: sheen-slide 0.7s ease-in-out forwards;
                  }
                  .dust-effect {
                    position: absolute; inset: 0;
                    background-image:
                        radial-gradient(white 1.2px, transparent 1.3px),
                        radial-gradient(rgba(255,255,255,0.8) 2.2px, transparent 2.3px),
                        radial-gradient(rgba(255,255,255,0.7) 0.6px, transparent 0.7px),
                        radial-gradient(rgba(255,255,255,0.9) 1.6px, transparent 1.7px);
                    background-size: 53px 53px, 67px 67px, 37px 37px, 47px 47px;
                    opacity: 0.6;
                    mix-blend-mode: overlay;
                    pointer-events: none;
                    z-index: 15;
                    animation: dust-float 25s linear infinite;
                  }
                  @keyframes dust-float {
                    0% {
                      background-position:
                        0 0,
                        40px 30px,
                        25px 15px,
                        10px 50px;
                    }
                    100% {
                      background-position:
                        -100px 50px,
                        120px -20px,
                        80px -30px,
                        -50px 80px;
                    }
                  }
                  .animate-sheen-auto .sheen-effect {
                    animation: sheen-slide 2s ease-in-out infinite;
                    animation-delay: 1s;
                  }
                `}</style>
                <button
                onClick={handleCtaClick}
                className="giant-btn w-full h-32 md:h-40 bg-gradient-to-r from-gold-primary to-gold-secondary text-white shadow-[0_-10px_50px_rgba(245,197,24,0.25)] border-t border-white/20 hover:brightness-105 transition-all flex flex-col items-center justify-center active:scale-[0.99] relative overflow-hidden group pb-[3px]"
                >
                  <div className="sheen-effect"></div>
                  <div className="dust-effect"></div>

                  <motion.span
                    animate={{ y: showSubtitle ? -16 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="drop-shadow-sm tracking-wide relative z-10 font-secular font-bold text-[40px] md:text-[4.1rem]"
                  >
                    אני רוצה אלבום חכם
                  </motion.span>

                  <AnimatePresence>
                    {showSubtitle && (
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute bottom-3 md:bottom-6 text-base md:text-xl font-medium tracking-wider text-white/90 z-10 bg-black/30 px-4 py-1 rounded-full backdrop-blur-2xl border border-white/10 shadow-sm"
                      >
                        לבחירה מהחבילות שלנו
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GalleryShowcase;
