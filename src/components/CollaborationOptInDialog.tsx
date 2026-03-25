import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CollaborationOptInDialogProps {
  open: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

const CollaborationOptInDialog = ({
  open,
  projectId,
  projectTitle,
  onClose,
}: CollaborationOptInDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleOptIn = async (openForCollab: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ collaboration_open: openForCollab })
        .eq("id", projectId);

      if (error) throw error;

      toast.success(
        openForCollab
          ? "Project is now open for collaboration!"
          : "Project saved as private"
      );
      onClose();
    } catch (error: any) {
      console.error("Error updating collaboration status:", error);
      toast.error("Failed to update collaboration status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open for Collaboration?</DialogTitle>
          <DialogDescription>
            Would you like "{projectTitle}" to be open for collaboration? Other
            students will be able to see and request to join this project.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOptIn(false)}
            disabled={loading}
          >
            No, Keep Private
          </Button>
          <Button
            onClick={() => handleOptIn(true)}
            disabled={loading}
          >
            Yes, Open for Collaboration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationOptInDialog;
