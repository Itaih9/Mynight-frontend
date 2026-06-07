import { Variants } from 'framer-motion';

export const cubeVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 1,
    scale: 1,
    zIndex: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    zIndex: 2,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1,
    scale: 1,
    zIndex: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  }),
};
