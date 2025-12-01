import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendAdviceDialogProps {
  recipientId: string;
  recipientName: string;
  currentUserId: string;
}

const SendAdviceDialog = ({ recipientId, recipientName, currentUserId }: SendAdviceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [canSendAdvice, setCanSendAdvice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdvicePermission();
  }, [currentUserId, recipientId]);

  const checkAdvicePermission = async () => {
    try {
      // Get current user's grade
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("grade")
        .eq("id", currentUserId)
        .single();

      // Get recipient's grade
      const { data: theirProfile } = await supabase
        .from("profiles")
        .select("grade")
        .eq("id", recipientId)
        .single();

      if (!myProfile || !theirProfile) {
        setCanSendAdvice(false);
        setLoading(false);
        return;
      }

      const myGrade = myProfile.grade?.toLowerCase() || "";
      const theirGrade = theirProfile.grade?.toLowerCase() || "";

      // Check if user is graduate or college student
      if (myGrade.includes("graduate") || myGrade.includes("college")) {
        setCanSendAdvice(true);
        setLoading(false);
        return;
      }

      // Check if user's numerical grade is higher
      const myGradeNum = parseInt(myGrade);
      const theirGradeNum = parseInt(theirGrade);

      if (!isNaN(myGradeNum) && !isNaN(theirGradeNum) && myGradeNum > theirGradeNum) {
        setCanSendAdvice(true);
      } else {
        setCanSendAdvice(false);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking advice permission:", error);
      setCanSendAdvice(false);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("advice_messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: recipientId,
          message: message.trim(),
        });

      if (error) throw error;

      toast.success(`Advice sent to ${recipientName}!`);
      setMessage("");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;
  if (!canSendAdvice) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Send Advice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Advice to {recipientName}</DialogTitle>
          <DialogDescription>
            Share your experience and guidance with {recipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your advice here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendAdviceDialog;
