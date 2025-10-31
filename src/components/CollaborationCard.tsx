import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock } from "lucide-react";

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
  return (
    <Card className="glass-card shadow-card p-6 hover:shadow-elegant transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={avatar} alt={author} />
          <AvatarFallback>{author[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">by {author}</p>
            </div>
            <Button className="gradient-primary shadow-glow" onClick={onRequestCollaboration}>
              <Users className="h-4 w-4 mr-2" />
              Join Project
            </Button>
          </div>
          
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
            {description}
          </p>
          
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Required skills:</span>
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
          
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {timePosted}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CollaborationCard;
