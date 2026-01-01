import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const CountUp = ({ 
  value, 
  duration = 1, 
  suffix = "",
  className 
}: CountUpProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000
  });

  const display = useTransform(spring, (latest) => 
    Math.round(latest).toString()
  );

  useEffect(() => {
    if (!hasAnimated && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, 300);
      return () => clearTimeout(timer);
    } else if (prefersReducedMotion) {
      spring.set(value);
    }
  }, [value, spring, hasAnimated, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <span className={className}>{value}{suffix}</span>;
  }

  return (
    <motion.span className={className}>
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};
