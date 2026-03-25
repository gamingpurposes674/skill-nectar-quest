import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Sparkles, Rocket, MessageSquare } from "lucide-react";

interface CollaborationCelebrationProps {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  creatorName: string;
  creatorAvatar: string | null;
  collaboratorName: string;
  collaboratorAvatar: string | null;
  onOpenChat?: () => void;
}

const CollaborationCelebration = ({
  open,
  onClose,
  projectTitle,
  creatorName,
  creatorAvatar,
  collaboratorName,
  collaboratorAvatar,
  onOpenChat,
}: CollaborationCelebrationProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-secondary/15 blur-3xl" />
        </div>

        <div className="relative p-8 text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { scale: 0, rotate: -180 }}
            animate={prefersReducedMotion ? undefined : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto shadow-glow">
              <Rocket className="h-8 w-8 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Title */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-xl font-bold tracking-tight font-['Space_Grotesk',sans-serif] text-foreground flex items-center justify-center gap-2">
                  You're Now Collaborating!
                  <Sparkles className="h-5 w-5 text-primary" />
                </h2>
                <p className="text-sm text-muted-foreground">
                  on <span className="font-medium text-accent">{projectTitle}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatars */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-4"
              >
                <motion.div
                  initial={prefersReducedMotion ? undefined : { x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="text-center"
                >
                  <Avatar className="h-16 w-16 ring-3 ring-primary/30 mx-auto">
                    <AvatarImage src={creatorAvatar || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10">{creatorName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium text-foreground mt-2 max-w-[80px] truncate">{creatorName}</p>
                  <p className="text-[10px] text-muted-foreground">Creator</p>
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? undefined : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  className="text-2xl"
                >
                  🤝
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? undefined : { x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="text-center"
                >
                  <Avatar className="h-16 w-16 ring-3 ring-accent/30 mx-auto">
                    <AvatarImage src={collaboratorAvatar || undefined} />
                    <AvatarFallback className="text-lg bg-accent/10">{collaboratorName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium text-foreground mt-2 max-w-[80px] truncate">{collaboratorName}</p>
                  <p className="text-[10px] text-muted-foreground">Collaborator</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-muted/30 rounded-xl p-4 border border-border/50 text-left space-y-2"
              >
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">What's next?</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-primary flex-shrink-0" />
                    Use the project chat to coordinate with your partner
                  </li>
                  <li className="flex items-center gap-2">
                    <Rocket className="h-3 w-3 text-accent flex-shrink-0" />
                    Both press "Project Complete" when finished for +4% health boost
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="flex gap-3"
              >
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Got it
                </Button>
                {onOpenChat && (
                  <Button className="flex-1" onClick={onOpenChat}>
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Start Chatting
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationCelebration;
