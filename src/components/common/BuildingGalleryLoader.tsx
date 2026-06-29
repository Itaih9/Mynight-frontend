import { Check, Sparkles, Calendar } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import InfinityRingsLoader from './InfinityRingsLoader';

interface BuildingGalleryLoaderProps {
  onComplete: () => void;
  coupleNames: string;
  eventDate?: string;
}

const statusMessages = [
  "מאמת עסקה מאובטחת...",
  "מקצה שרת פרטי לאירוע...",
  "מפעיל מנוע זיהוי פנים AI...",
  "מכין את הגלריה הדיגיטלית...",
  "מסנכרן הגדרות מותאמות אישית...",
  "בונה את האלבום שלכם..."
];

export const BuildingGalleryLoader: React.FC<BuildingGalleryLoaderProps> = ({ onComplete, coupleNames, eventDate }) => {
  const [step, setStep] = useState<'approved' | 'building' | 'final'>('approved');
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : '';

  useEffect(() => {
    const approvedTimeout = setTimeout(() => {
      setStep('building');
    }, 1500);
    return () => clearTimeout(approvedTimeout);
  }, []);

  useEffect(() => {
    if (step === 'building') {
      const duration = 7000;
      const interval = 35;
      const increment = 100 / (duration / interval);

      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setStep('final');
            return 100;
          }
          return prev + increment;
        });
      }, interval);

      const statusTimer = setInterval(() => {
        setStatusIndex(prev => (prev < statusMessages.length - 1 ? prev + 1 : prev));
      }, 3000);

      return () => {
        clearInterval(timer);
        clearInterval(statusTimer);
      };
    }
  }, [step]);

  useEffect(() => {
    if (step === 'final') {
      const finalTimeout = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(finalTimeout);
    }
  }, [step, onComplete]);

  const sparkleVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: [0, 1, 0.5],
      opacity: [0, 1, 0],
      x: Math.cos(i * 45 * (Math.PI / 180)) * 60,
      y: Math.sin(i * 45 * (Math.PI / 180)) * 60,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.1
      }
    })
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-xl px-4 overflow-hidden" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'approved' && (
          <motion.div
            key="approved-state"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            className="w-full max-w-2xl bg-white p-10 md:p-16 rounded-[50px] shadow-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[450px]"
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20 mb-8">
              <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-black tracking-tight text-center">התשלום אושר!</h2>
            <p className="text-gray-400 text-lg mt-4 font-medium">מתחילים בהקמת האלבום...</p>
          </motion.div>
        )}

        {(step === 'building' || step === 'final') && (
          <motion.div
            key="building-state"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-white p-10 md:p-16 rounded-[50px] shadow-2xl border border-gray-100 flex flex-col items-center min-h-[450px]"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gold-primary/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative flex items-center justify-center min-h-[160px] w-[160px]">
                {step === 'final' ? (
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.5, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-gold-primary z-10"
                    >
                      <Sparkles size={80} className="animate-pulse" />
                    </motion.div>

                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        custom={i}
                        variants={sparkleVariants}
                        initial="initial"
                        animate="animate"
                        className="absolute w-2 h-2 bg-gold-secondary rounded-full"
                      />
                    ))}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`star-${i}`}
                        custom={i * 60}
                        variants={sparkleVariants}
                        initial="initial"
                        animate="animate"
                        className="absolute text-gold-primary"
                      >
                         <Sparkles size={12} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <InfinityRingsLoader size={160} />
                )}
              </div>
            </div>

            <div className="text-center mb-10 space-y-3">
              <h3 className="text-3xl font-bold text-black tracking-tight">
                {step === 'final' ? 'הכל מוכן!' : 'מבצעים את ההגדרות האחרונות'}
              </h3>
              <p className="text-xl text-gray-400 font-light">בונים עבורכם חוויה דיגיטלית מושלמת</p>
            </div>

            <div className="w-full h-14 flex items-center justify-center mb-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="font-mono text-lg text-black font-medium tracking-tight text-center"
                >
                  {step === 'final' ? 'כל המערכות פועלות כשורה' : statusMessages[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-10">
              <motion.div
                className="h-full bg-gold-primary shadow-[0_0_20px_rgba(245,197,24,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-2"
            >
              <p className="text-xl font-bold text-black/80">
                {coupleNames}
              </p>
              {formattedDate && (
                <p className="text-gray-400 flex items-center justify-center gap-2 font-medium" dir="rtl">
                  <Calendar size={16} className="-translate-y-[1px]" />
                  <span>{formattedDate}</span>
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'final' && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 bg-white z-[110]"
        />
      )}
    </div>
  );
};
