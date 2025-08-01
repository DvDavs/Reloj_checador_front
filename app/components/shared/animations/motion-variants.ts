export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const fadeOut = {
  hidden: { opacity: 1 },
  visible: { opacity: 0, transition: { duration: 0.5 } },
};

export const slideInFromLeft = {
  hidden: { x: '-100vw', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } },
};

export const slideInFromRight = {
  hidden: { x: '100vw', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 50 } },
};

export const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
}; 