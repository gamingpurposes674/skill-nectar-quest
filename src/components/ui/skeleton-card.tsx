import { motion, Easing } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
}

const pulseAnimation = {
  animate: {
    opacity: [0.5, 0.8, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut" as Easing
  }
};

export const SkeletonCard = ({ 
  className, 
  lines = 3,
  showAvatar = true 
}: SkeletonCardProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
        <div className="flex items-start gap-4">
          {showAvatar && (
            <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0 animate-pulse" />
          )}
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            {Array.from({ length: lines }).map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-3 rounded bg-muted animate-pulse",
                  i === lines - 1 ? "w-1/2" : "w-full"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 shadow-sm",
      className
    )}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <motion.div 
            className="h-12 w-12 rounded-full bg-muted flex-shrink-0"
            animate={pulseAnimation.animate}
            transition={pulseAnimation.transition}
          />
        )}
        <div className="flex-1 space-y-3">
          <motion.div 
            className="h-4 w-2/3 rounded bg-muted"
            animate={pulseAnimation.animate}
            transition={pulseAnimation.transition}
          />
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div 
              key={i}
              className={cn(
                "h-3 rounded bg-muted",
                i === lines - 1 ? "w-1/2" : "w-full"
              )}
              animate={pulseAnimation.animate}
              transition={{ ...pulseAnimation.transition, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonStats = () => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                <div className="h-6 w-12 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <motion.div 
          key={i} 
          className="rounded-lg border bg-card p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="h-10 w-10 rounded-lg bg-muted"
              animate={pulseAnimation.animate}
              transition={pulseAnimation.transition}
            />
            <div className="space-y-2">
              <motion.div 
                className="h-3 w-16 rounded bg-muted"
                animate={pulseAnimation.animate}
                transition={pulseAnimation.transition}
              />
              <motion.div 
                className="h-6 w-12 rounded bg-muted"
                animate={pulseAnimation.animate}
                transition={pulseAnimation.transition}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
