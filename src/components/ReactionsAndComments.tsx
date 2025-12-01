import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, Smile, Heart, Meh, Frown, Star } from "lucide-react";

interface ReactionsAndCommentsProps {
  reactions: { [key: string]: number };
  comments: any[];
  userReaction: string | null;
  onReact: (type: string) => void;
  onPostComment: () => void;
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
  const reactionEmojis = [
    { type: "thumbsup", emoji: "👍", icon: ThumbsUp },
    { type: "grin", emoji: "😁", icon: Smile },
    { type: "heart", emoji: "❤️", icon: Heart },
    { type: "smile", emoji: "🙂", icon: Meh },
    { type: "neutral", emoji: "😐", icon: Meh },
    { type: "sad", emoji: "😢", icon: Frown },
  ];

  const isGraduate = (grade: string | null) => {
    if (!grade) return false;
    return grade.toLowerCase().includes("graduate") || grade.toLowerCase().includes("college");
  };

  return (
    <div className="space-y-6">
      {/* Reactions Bar */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Reactions</h3>
        <div className="flex flex-wrap gap-2">
          {reactionEmojis.map(({ type, emoji }) => (
            <Button
              key={type}
              variant={userReaction === type ? "default" : "outline"}
              size="sm"
              onClick={() => onReact(type)}
              className="gap-2"
            >
              <span className="text-lg">{emoji}</span>
              <span>{reactions[type] || 0}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Comments Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Comments</h3>
        
        {/* Add Comment */}
        <div className="space-y-2 mb-6">
          <Textarea
            placeholder="Leave a comment..."
            value={newComment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
          />
          <Button onClick={onPostComment}>Post Comment</Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 border-b pb-4 last:border-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback>
                    {comment.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.profiles?.full_name}
                    </span>
                    {isGraduate(comment.profiles?.grade) && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    )}
                    {comment.profiles?.grade && (
                      <span className="text-xs text-muted-foreground">
                        Grade: {comment.profiles.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{comment.comment}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReactionsAndComments;
