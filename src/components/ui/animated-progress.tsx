import * as React from "react";
import { motion } from "framer-motion";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AnimatedProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const AnimatedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  AnimatedProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {prefersReducedMotion ? (
        <ProgressPrimitive.Indicator
          className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      ) : (
        <motion.div
          className={cn("h-full bg-primary", indicatorClassName)}
          initial={{ width: "0%" }}
          animate={{ width: `${value || 0}%` }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2
          }}
        />
      )}
    </ProgressPrimitive.Root>
  );
});
AnimatedProgress.displayName = "AnimatedProgress";

export { AnimatedProgress };
