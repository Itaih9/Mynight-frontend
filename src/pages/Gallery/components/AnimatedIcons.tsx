import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedGiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
    <rect x="3" y="8" width="18" height="14" rx="2" />
    <path d="M12 8v14" />
    <motion.g
       initial={{ y: 0, rotate: 0 }}
       whileHover={{ y: -4, rotate: -5, transition: { type: "spring", stiffness: 300 } }}
       className="origin-bottom-right"
    >
      <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" className="fill-white" />
      <path d="M12 3v5" />
      <path d="M7.5 3H12" />
      <path d="M16.5 3H12" />
      <path d="M12 3c0-3 2.5-3 2.5 0" />
      <path d="M12 3c0-3-2.5-3-2.5 0" />
    </motion.g>
  </svg>
);

export const OpeningGiftAnimation = () => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center mb-2 overflow-visible">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gold-primary/10 rounded-full border border-gold-primary/20" />

       {[...Array(12)].map((_, i) => (
         <motion.div
           key={i}
           className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full z-0 ${['bg-gold-primary', 'bg-black', 'bg-gray-400'][i % 3]}`}
           initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
           animate={{
             opacity: [0, 1, 1, 0],
             y: [0, -50 - Math.random() * 30],
             x: [(Math.random() - 0.5) * 60],
             scale: [0, 1, 0],
             rotate: [0, Math.random() * 360]
           }}
           transition={{
             duration: 1.5,
             ease: "easeOut",
             delay: 0.6,
             repeat: Infinity,
             repeatDelay: 2
           }}
         />
       ))}

       <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-primary relative z-10 overflow-visible drop-shadow-sm">
         <path d="M4 10h16v11H4z" className="fill-gold-primary/20" />
         <path d="M12 10v11" strokeOpacity="0.6" />

         <motion.g
           initial={{ y: 0, rotate: 0 }}
           animate={{
             y: [0, 0, 0, -14, -14, 0],
             rotate: [0, -2, 2, -5, -8, 0],
           }}
           transition={{
             duration: 3.5,
             times: [0, 0.1, 0.2, 0.25, 0.5, 0.7],
             repeat: Infinity,
             ease: "easeInOut"
           }}
           style={{ originX: 0.5, originY: 1 }}
         >
            <path d="M2 6h20v4H2z" className="fill-gold-primary/30" />
            <path d="M12 6v4" strokeOpacity="0.6" />
            <path d="M7.5 6H12" strokeOpacity="0.6" />
            <path d="M16.5 6H12" strokeOpacity="0.6" />
            <path d="M12 6c0-3 2.5-3 2.5 0" />
            <path d="M12 6c0-3-2.5-3-2.5 0" />
         </motion.g>
       </svg>
    </div>
  );
};
