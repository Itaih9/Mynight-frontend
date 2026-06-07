import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import logoSvg from '@/assets/logo.svg';

interface ChampagneRevealProps {
  onComplete: () => void;
}

const ChampagneReveal: React.FC<ChampagneRevealProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'popping' | 'foam' | 'sliding'>('idle');

  useEffect(() => {
    const startDelay = 2500;

    const timers = [
      setTimeout(() => setPhase('shaking'), startDelay),
      setTimeout(() => {
        setPhase('popping');
        const count = 200;
        const defaults = { origin: { y: 0.55 }, zIndex: 350 };

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
          colors: ['#FFD700', '#F5C518']
        });
        fire(0.2, {
          spread: 60,
          colors: ['#DAA520', '#FFD700']
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
          colors: ['#FFD700', '#FFFFFF']
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
          colors: ['#FFD700']
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
          colors: ['#F5C518']
        });

      }, startDelay + 2000),
      setTimeout(() => setPhase('foam'), startDelay + 2100),
      setTimeout(() => setPhase('sliding'), startDelay + 3300),
      setTimeout(() => onComplete(), startDelay + 5000)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden pointer-events-none">
      <AnimatePresence>
        {(phase === 'shaking' || phase === 'popping') && (
          <motion.div
            initial={{ y: 500, rotate: 10 }}
            animate={phase === 'shaking' ? {
              y: 0,
              rotate: [10, -10, 10, -10, 10, -10, 10, -10, 10],
              x: [0, 5, -5, 5, -5, 5, -5, 5, 0]
            } : {
              scale: 1.1,
              y: 50,
              opacity: 0
            }}
            transition={{
              duration: phase === 'shaking' ? 2.0 : 0.4,
              ease: "easeInOut"
            }}
            className="relative z-20 w-32 md:w-48"
          >
            <svg viewBox="0 0 100 300" className="w-full h-auto drop-shadow-2xl">
              <path d="M30 300 L70 300 L70 120 C70 100 65 80 55 60 L55 20 L45 20 L45 60 C35 80 30 100 30 120 Z" fill="#1B3022" />
              <path d="M45 20 L55 20 L55 10 L45 10 Z" fill="#D4AF37" />
              <rect x="30" y="150" width="40" height="60" fill="#D4AF37" opacity="0.8" />
              <image href={logoSvg} x="32" y="165" width="36" height="30" preserveAspectRatio="xMidYMid contain" />
            </svg>

            {phase === 'popping' && (
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -800, x: 200, rotate: 720, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-[#C2B280] rounded-sm"
              />
            )}
          </motion.div>
        )}

        {phase === 'popping' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 4, 8],
                  x: (Math.random() - 0.5) * 1500,
                  y: (Math.random() - 0.7) * 1500,
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-8 h-8 bg-white rounded-full blur-md"
              />
            ))}
          </div>
        )}

        {(phase === 'foam' || phase === 'sliding') && (
          <motion.div
            initial={{ y: '100%' }}
            animate={phase === 'foam' ? { y: 0 } : { y: '100%' }}
            transition={{
              duration: phase === 'foam' ? 0.4 : 1.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="fixed inset-0 bg-white z-[250] flex flex-col items-center justify-center"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                {[...Array(100)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-gray-200 rounded-full blur-sm"
                        style={{
                            width: Math.random() * 100 + 20 + 'px',
                            height: Math.random() * 100 + 20 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                        }}
                    />
                ))}
            </div>
            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-black text-4xl md:text-6xl font-black tracking-tighter relative z-10"
            >
              מזל טוב!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChampagneReveal;
