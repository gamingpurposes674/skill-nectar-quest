import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Link } from "react-router-dom";

interface CollaborationCardProps {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  avatar: string;
  description: string;
  skills: string[];
  timePosted: string;
  coverImageUrl?: string | null;
  onRequestCollaboration: () => void;
}

const GRADIENT_PALETTES = [
  "from-[hsl(265,83%,57%)] via-[hsl(217,91%,60%)] to-[hsl(240,70%,35%)]",
  "from-[hsl(217,91%,55%)] via-[hsl(265,83%,50%)] to-[hsl(222,47%,20%)]",
  "from-[hsl(265,70%,45%)] via-[hsl(240,60%,50%)] to-[hsl(217,91%,40%)]",
  "from-[hsl(230,80%,50%)] via-[hsl(265,83%,57%)] to-[hsl(217,60%,30%)]",
];

const reactionEmojis = [
  { type: "thumbsup", emoji: "👍" },
  { type: "fire", emoji: "🔥" },
  { type: "idea", emoji: "💡" },
  { type: "heart", emoji: "❤️" },
];

const CollaborationCard = ({
  id,
  title,
  author,
  authorId,
  avatar,
  description,
  skills,
  timePosted,
  coverImageUrl,
  onRequestCollaboration,
}: CollaborationCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const gradientIndex = id.charCodeAt(0) % GRADIENT_PALETTES.length;
  const gradientClass = GRADIENT_PALETTES[gradientIndex];

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

  const shouldTruncate = description.length > 120;
  const displayDescription = !expanded && shouldTruncate ? description.slice(0, 120) : description;

  return (
    <motion.div
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -2, transition: { duration: 0.2 } }
      }
    >
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_20px_hsl(var(--accent)/0.08)]">
        {/* Banner — 160px */}
        <div className="relative h-40 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
          )}
          {/* Dark gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

          {/* Join button — top right */}
          <div className="absolute top-3 right-3 z-10">
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            >
              <Button
                size="sm"
                onClick={onRequestCollaboration}
                className="h-7 px-3 text-[11px] font-semibold bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm border border-primary-foreground/10 shadow-lg"
              >
                <Users className="h-3 w-3 mr-1" />
                Join
              </Button>
            </motion.div>
          </div>

          {/* Title overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 z-10">
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
        </div>

        {/* Body */}
        <div className="px-5 pt-3.5 pb-4 space-y-3">
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
  );
};

export default CollaborationCard;
