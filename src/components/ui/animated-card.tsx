import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, hoverEffect = true, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            className
          )}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={
          hoverEffect
            ? {
                scale: 1.01,
                boxShadow: "0 10px 40px hsl(210 100% 56% / 0.1)",
                borderColor: "hsl(210 100% 56% / 0.3)",
                transition: { duration: 0.2 }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };
