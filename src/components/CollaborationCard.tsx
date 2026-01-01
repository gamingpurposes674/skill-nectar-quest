import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface CollaborationCardProps {
  id: string;
  title: string;
  author: string;
  avatar: string;
  description: string;
  skills: string[];
  timePosted: string;
  onRequestCollaboration: () => void;
}

const CollaborationCard = ({
  id,
  title,
  author,
  avatar,
  description,
  skills,
  timePosted,
  onRequestCollaboration
}: CollaborationCardProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { 
        scale: 1.005,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="glass-card shadow-card p-6 hover:shadow-elegant transition-all duration-300 group hover:border-primary/20">
        <div className="flex items-start gap-4">
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src={avatar} alt={author} />
              <AvatarFallback>{author[0]}</AvatarFallback>
            </Avatar>
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">by {author}</p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              >
                <Button className="gradient-primary shadow-glow" onClick={onRequestCollaboration}>
                  <Users className="h-4 w-4 mr-2" />
                  Join Project
                </Button>
              </motion.div>
            </div>
            
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
              {description}
            </p>
            
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Required skills:</span>
              {skills.map((skill, index) => (
                <motion.div
                  key={skill}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <Badge variant="secondary" className="text-xs hover:bg-secondary/80 transition-colors">
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {timePosted}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default CollaborationCard;
