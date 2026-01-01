// Framer Motion animation variants for consistent, production-quality animations
// All animations are subtle, 60fps-ready, and designed for professional UX

export const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// Card hover animation
export const cardHover = {
  rest: { 
    scale: 1,
    boxShadow: "0 4px 16px hsl(222 47% 11% / 0.08)"
  },
  hover: { 
    scale: 1.01,
    boxShadow: "0 10px 40px hsl(210 100% 56% / 0.12)",
    transition: { duration: 0.25, ease: "easeOut" }
  }
};

// Button press animation
export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

// Progress bar animation
export const progressFill = (value: number) => ({
  initial: { width: "0%" },
  animate: { 
    width: `${value}%`,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }
  }
});

// Modal animations
export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96,
    transition: { duration: 0.15 }
  }
};

// Page transition
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

// Notification bell shake
export const bellShake = {
  animate: {
    rotate: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5, ease: "easeInOut" }
  }
};

// Count up animation helper
export const countUp = (from: number, to: number, duration: number = 1) => ({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
});

// Skeleton pulse
export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  }
};
