import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, Clock, Images, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CollaborationCardProps {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  ownerId?: string;
  avatar: string;
  description: string;
  skills: string[];
  timePosted: string;
  coverImageUrl?: string | null;
  imageUrls?: string[];
  onRequestCollaboration: () => void;
}

const reactionEmojis = [
  { type: "thumbsup", emoji: "👍" },
  { type: "fire", emoji: "🔥" },
  { type: "idea", emoji: "💡" },
  { type: "heart", emoji: "❤️" },
  { type: "clap", emoji: "👏" },
  { type: "rocket", emoji: "🚀" },
  { type: "star", emoji: "⭐" },
  { type: "hundred", emoji: "💯" },
];

const CollaborationCard = ({
  id,
  title,
  author,
  authorId,
  ownerId,
  avatar,
  description,
  skills,
  timePosted,
  coverImageUrl,
  imageUrls = [],
  onRequestCollaboration,
}: CollaborationCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Combine cover image + additional images into one array
  const allImages = [
    ...(coverImageUrl ? [coverImageUrl] : []),
    ...imageUrls,
  ].filter(Boolean);
  const hasImages = allImages.length > 0;

  const handleReact = (type: string) => {
    setReactions((prev) => {
      const updated = { ...prev };
      if (userReaction === type) {
        updated[type] = Math.max(0, (updated[type] || 1) - 1);
        setUserReaction(null);
      } else {
        if (userReaction) {
          updated[userReaction] = Math.max(0, (updated[userReaction] || 1) - 1);
        }
        updated[type] = (updated[type] || 0) + 1;
        setUserReaction(type);
      }
      return updated;
    });
  };

  const prevImage = () =>
    setCarouselIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  const nextImage = () =>
    setCarouselIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));

  const shouldTruncate = description.length > 120;
  const displayDescription =
    !expanded && shouldTruncate ? description.slice(0, 120) : description;

  return (
    <>
      <motion.div
        whileHover={
          prefersReducedMotion
            ? undefined
            : { y: -2, transition: { duration: 0.2 } }
        }
      >
        <div
          className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_hsl(var(--accent)/0.15)] cursor-pointer"
          onClick={(e) => {
            // Don't navigate if clicking an interactive element
            const target = e.target as HTMLElement;
            if (target.closest("button") || target.closest("a")) return;
            navigate(`/project/${id}`);
          }}
        >
          {/* Body — text-focused */}
          <div className="px-5 pt-5 pb-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold leading-snug text-foreground tracking-tight font-['Space_Grotesk',sans-serif]">
                  {title}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  by{" "}
                  {authorId ? (
                    <Link
                      to={`/profile/${authorId}`}
                      className="text-accent hover:text-accent/80 hover:underline underline-offset-2 transition-colors duration-150 font-medium"
                    >
                      {author}
                    </Link>
                  ) : (
                    <span className="text-accent font-medium">{author}</span>
                  )}
                  <span className="mx-1.5 text-border">·</span>
                  <Clock className="inline h-3 w-3 -mt-px mr-0.5" />
                  {timePosted}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Image carousel trigger */}
                {hasImages && (
                  <motion.div
                    whileHover={
                      prefersReducedMotion ? undefined : { scale: 1.08 }
                    }
                    whileTap={
                      prefersReducedMotion ? undefined : { scale: 0.95 }
                    }
                  >
                    <button
                      onClick={() => {
                        setCarouselIndex(0);
                        setCarouselOpen(true);
                      }}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/50 hover:border-accent/40 hover:text-accent transition-all duration-200"
                    >
                      <Images className="h-3.5 w-3.5" />
                      <span>{allImages.length}</span>
                    </button>
                  </motion.div>
                )}

                {/* Join button */}
                <motion.div
                  whileHover={
                    prefersReducedMotion ? undefined : { scale: 1.04 }
                  }
                  whileTap={
                    prefersReducedMotion ? undefined : { scale: 0.96 }
                  }
                >
                  <Button
                    size="sm"
                    onClick={onRequestCollaboration}
                    className="h-7 px-3 text-[11px] font-semibold bg-primary/90 hover:bg-primary text-primary-foreground border border-primary-foreground/10"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Join
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {displayDescription}
              {shouldTruncate && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="ml-1 text-accent hover:text-accent/80 font-medium transition-colors text-[12px]"
                >
                  read more
                </button>
              )}
              {expanded && shouldTruncate && (
                <button
                  onClick={() => setExpanded(false)}
                  className="ml-1 text-accent hover:text-accent/80 font-medium transition-colors text-[12px]"
                >
                  show less
                </button>
              )}
            </p>

            {/* Skill tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/60 tracking-wide"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 6 && (
                <span className="text-[10px] text-muted-foreground/60 font-medium">
                  +{skills.length - 6}
                </span>
              )}
            </div>

            {/* Reaction bar */}
            <div className="flex items-center gap-0.5 pt-2.5 border-t border-border/30">
              {reactionEmojis.map(({ type, emoji }) => (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all duration-150 hover:bg-muted/60 ${
                    userReaction === type
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/70"
                  }`}
                >
                  <span className="text-[13px] leading-none">{emoji}</span>
                  <span className="font-medium tabular-nums">
                    {reactions[type] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Carousel Overlay */}
      <AnimatePresence>
        {carouselOpen && hasImages && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setCarouselOpen(false)}
            />

            {/* Carousel container */}
            <motion.div
              className="relative z-10 w-full max-w-2xl mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Close button */}
              <button
                onClick={() => setCarouselOpen(false)}
                className="absolute -top-10 right-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-20"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image area */}
              <div className="relative rounded-xl overflow-hidden bg-card border border-border/50 shadow-2xl">
                <div className="relative aspect-video overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={carouselIndex}
                      src={allImages[carouselIndex]}
                      alt={`${title} — image ${carouselIndex + 1}`}
                      className="w-full h-full object-contain bg-muted/20"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    />
                  </AnimatePresence>
                </div>

                {/* Navigation arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/40 text-foreground/80 hover:text-foreground hover:bg-background/80 transition-all duration-150"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/40 text-foreground/80 hover:text-foreground hover:bg-background/80 transition-all duration-150"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                {/* Dot indicators + counter */}
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
                  {allImages.length > 1 &&
                    allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          i === carouselIndex
                            ? "w-5 bg-accent"
                            : "w-1.5 bg-foreground/25 hover:bg-foreground/40"
                        }`}
                      />
                    ))}
                </div>
              </div>

              {/* Title below */}
              <p className="text-center text-[13px] text-muted-foreground mt-3">
                {title}{" "}
                <span className="text-border">
                  · {carouselIndex + 1}/{allImages.length}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollaborationCard;
