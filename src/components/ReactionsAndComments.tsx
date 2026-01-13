import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star, GraduationCap, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ReactionsAndCommentsProps {
  reactions: { [key: string]: number };
  comments: any[];
  userReaction: string | null;
  onReact: (type: string) => void;
  onPostComment: (commentType: "student" | "graduate") => void;
  newComment: string;
  onCommentChange: (value: string) => void;
}

const ReactionsAndComments = ({
  reactions,
  comments,
  userReaction,
  onReact,
  onPostComment,
  newComment,
  onCommentChange,
}: ReactionsAndCommentsProps) => {
  const [commentType, setCommentType] = useState<"student" | "graduate">("student");
  const prefersReducedMotion = useReducedMotion();
  
  const reactionEmojis = [
    { type: "thumbsup", emoji: "👍" },
    { type: "grin", emoji: "😁" },
    { type: "heart", emoji: "❤️" },
    { type: "smile", emoji: "🙂" },
    { type: "neutral", emoji: "😐" },
    { type: "sad", emoji: "😢" },
  ];

  const isGraduate = (grade: string | null) => {
    if (!grade) return false;
    const gradeLower = grade.toLowerCase();
    return gradeLower.includes("graduate") || gradeLower.includes("college") || gradeLower.includes("university");
  };

  const handlePostComment = () => {
    if (newComment.trim()) {
      onPostComment(commentType);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reactions Bar */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Reactions</h3>
        <div className="flex flex-wrap gap-2">
          {reactionEmojis.map(({ type, emoji }) => (
            <motion.div
              key={type}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            >
              <Button
                variant={userReaction === type ? "default" : "outline"}
                size="sm"
                onClick={() => onReact(type)}
                className="gap-2 transition-all"
              >
                <span className="text-lg">{emoji}</span>
                <span>{reactions[type] || 0}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Feedback Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Feedback & Suggestions</h3>
        
        {/* Add Feedback */}
        <div className="space-y-4 mb-6">
          <Textarea
            placeholder="Share feedback or suggestions to help improve this portfolio..."
            value={newComment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
          />
          
          {/* Comment Type Selection */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Comment as:</span>
            <RadioGroup
              value={commentType}
              onValueChange={(value: "student" | "graduate") => setCommentType(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="flex items-center gap-1 cursor-pointer">
                  <User className="h-3 w-3" />
                  Student
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="graduate" id="graduate" />
                <Label htmlFor="graduate" className="flex items-center gap-1 cursor-pointer">
                  <GraduationCap className="h-3 w-3" />
                  Graduate
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button onClick={handlePostComment} disabled={!newComment.trim()}>
            Post Feedback
          </Button>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          <AnimatePresence>
            {comments.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center py-4"
              >
                No feedback yet. Be the first to help improve this portfolio!
              </motion.p>
            ) : (
              comments.map((comment, index) => {
                const commentIsGraduate = isGraduate(comment.profiles?.grade);
                return (
                  <motion.div
                    key={comment.id}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3 border-b pb-4 last:border-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback>
                        {comment.profiles?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {comment.profiles?.full_name || "Anonymous"}
                        </span>
                        {commentIsGraduate && (
                          <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                            <Star className="h-3 w-3 fill-current" />
                            IMPORTANT
                          </Badge>
                        )}
                        {comment.profiles?.grade && (
                          <span className="text-xs text-muted-foreground">
                            {comment.profiles.grade}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{comment.comment}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

export default ReactionsAndComments;
