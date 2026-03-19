import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  "from-primary/60 via-secondary/40 to-accent/30",
  "from-secondary/60 via-primary/40 to-accent/30",
  "from-accent/50 via-primary/40 to-secondary/30",
  "from-primary/50 via-accent/30 to-secondary/40",
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
  onRequestCollaboration
}: CollaborationCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  // Deterministic gradient based on project id
  const gradientIndex = id.charCodeAt(0) % GRADIENT_PALETTES.length;
  const gradientClass = GRADIENT_PALETTES[gradientIndex];

  const handleReact = (type: string) => {
    setReactions(prev => {
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

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { 
        y: -2,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="glass-card shadow-card overflow-hidden hover:shadow-elegant transition-all duration-300 group hover:border-primary/20">
        {/* Cover Image / Gradient Placeholder */}
        <div className="relative h-36 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-end`}>
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent" />
              <h3 className="relative z-10 px-6 pb-4 text-xl font-bold tracking-tight text-foreground/90 line-clamp-2 font-['Space_Grotesk',sans-serif]">
                {title}
              </h3>
            </div>
          )}
          {/* Floating time badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md text-[11px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            {timePosted}
          </div>
        </div>

        <div className="p-5 space-y-3.5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                transition={{ duration: 0.15 }}
              >
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={avatar} alt={author} />
                  <AvatarFallback className="text-xs">{author[0]}</AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="min-w-0">
                {coverImageUrl && (
                  <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors duration-200 truncate">
                    {title}
                  </h3>
                )}
                <p className="text-[13px] text-muted-foreground">
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
                </p>
              </div>
            </div>
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className="flex-shrink-0"
            >
              <Button size="sm" className="gradient-primary shadow-glow text-xs h-8 px-3" onClick={onRequestCollaboration}>
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Join
              </Button>
            </motion.div>
          </div>
          
          <p className="text-sm text-foreground/75 leading-relaxed line-clamp-2">
            {description}
          </p>
          
          {/* Skills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[11px] px-2 py-0.5 font-medium hover:bg-secondary/80 transition-colors">
                {skill}
              </Badge>
            ))}
            {skills.length > 5 && (
              <span className="text-[11px] text-muted-foreground">+{skills.length - 5}</span>
            )}
          </div>

          {/* Reaction bar */}
          <div className="flex items-center gap-1 pt-1 border-t border-border/50">
            {reactionEmojis.map(({ type, emoji }) => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-150 hover:bg-muted/80 ${
                  userReaction === type
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <span className="text-sm">{emoji}</span>
                {(reactions[type] || 0) > 0 && (
                  <span className="font-medium tabular-nums">{reactions[type]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default CollaborationCard;
