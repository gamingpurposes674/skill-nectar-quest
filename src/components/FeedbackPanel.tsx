import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, Flame, Lightbulb, MessageSquare } from "lucide-react";

interface FeedbackPanelProps {
  reactions: {
    thumbsUp: number;
    flame: number;
    lightbulb: number;
    message: number;
  };
  onReact: (type: keyof FeedbackPanelProps['reactions']) => void;
}

const FeedbackPanel = ({ reactions, onReact }: FeedbackPanelProps) => {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");

  const reactionButtons = [
    { icon: ThumbsUp, type: 'thumbsUp' as const, label: 'Like', color: 'hover:text-primary' },
    { icon: Flame, type: 'flame' as const, label: 'Fire', color: 'hover:text-destructive' },
    { icon: Lightbulb, type: 'lightbulb' as const, label: 'Insight', color: 'hover:text-accent' },
    { icon: MessageSquare, type: 'message' as const, label: 'Comment', color: 'hover:text-secondary' }
  ];

  const handleReaction = (type: keyof FeedbackPanelProps['reactions']) => {
    if (type === 'message') {
      setShowCommentBox(!showCommentBox);
    } else {
      onReact(type);
    }
  };

  return (
    <Card className="glass-card shadow-card p-6 animate-scale-in">
      <h3 className="font-semibold mb-4">Reactions & Feedback</h3>
      
      <div className="grid grid-cols-4 gap-3 mb-4">
        {reactionButtons.map(({ icon: Icon, type, label, color }) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-all ${color} hover:scale-105`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{reactions[type]}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      {showCommentBox && (
        <div className="space-y-3 animate-fade-in">
          <Textarea
            placeholder="Leave constructive feedback..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setShowCommentBox(false);
                setComment("");
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                if (comment.trim()) {
                  onReact('message');
                  setComment("");
                  setShowCommentBox(false);
                }
              }}
            >
              Post Feedback
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-2">Recent Feedback</p>
        <div className="space-y-3">
          {[
            { author: "Sarah M.", comment: "Great project showcase! Love the UI design." },
            { author: "Mike K.", comment: "Your coding skills are impressive for your grade!" }
          ].map((feedback, idx) => (
            <div key={idx} className="text-sm bg-muted/30 rounded-lg p-3">
              <p className="font-medium text-xs text-primary mb-1">{feedback.author}</p>
              <p className="text-foreground/80">{feedback.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default FeedbackPanel;
