import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserCheck, Clock, UserMinus } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ConnectionButtonProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  onConnectionChange?: () => void;
}

type ConnectionStatus = "none" | "pending_sent" | "pending_received" | "connected";

const ConnectionButton = ({
  currentUserId,
  targetUserId,
  targetUserName,
  onConnectionChange,
}: ConnectionButtonProps) => {
  const [status, setStatus] = useState<ConnectionStatus>("none");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    checkConnectionStatus();
  }, [currentUserId, targetUserId]);

  const checkConnectionStatus = async () => {
    try {
      // Check if there's an existing connection
      const { data: connections, error } = await supabase
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
        );

      if (error) throw error;

      if (connections && connections.length > 0) {
        const connection = connections[0];
        if (connection.status === "accepted") {
          setStatus("connected");
        } else if (connection.status === "pending") {
          if (connection.requester_id === currentUserId) {
            setStatus("pending_sent");
          } else {
            setStatus("pending_received");
          }
        }
      } else {
        setStatus("none");
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async () => {
    setActionLoading(true);
    try {
      // Get current user's profile for the notification
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single();

      // Create connection request
      const { error: connError } = await supabase.from("connections").insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: "pending",
      });

      if (connError) throw connError;

      // Create notification for the target user
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "connection_request",
        title: "New Connection Request",
        message: `${myProfile?.full_name || "Someone"} wants to connect with you`,
        from_user_id: currentUserId,
        reference_type: "connection",
      });

      if (notifError) console.error("Notification error:", notifError);

      setStatus("pending_sent");
      toast.success(`Connection request sent to ${targetUserName}`);
      onConnectionChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to send connection request");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelConnectionRequest = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("requester_id", currentUserId)
        .eq("addressee_id", targetUserId);

      if (error) throw error;

      setStatus("none");
      toast.success("Connection request cancelled");
      onConnectionChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
  };

  const acceptConnectionRequest = async () => {
    setActionLoading(true);
    try {
      // Get the other user's profile for the notification
      const { data: theirProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", targetUserId)
        .single();

      // Get current user's profile
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single();

      // Update connection status
      const { error: connError } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("requester_id", targetUserId)
        .eq("addressee_id", currentUserId);

      if (connError) throw connError;

      // Create notification for the requester
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "connection_accepted",
        title: "Connection Accepted",
        message: `${myProfile?.full_name || "Someone"} accepted your connection request`,
        from_user_id: currentUserId,
        reference_type: "connection",
      });

      if (notifError) console.error("Notification error:", notifError);

      setStatus("connected");
      toast.success(`You are now connected with ${theirProfile?.full_name || targetUserName}`);
      onConnectionChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept connection");
    } finally {
      setActionLoading(false);
    }
  };

  const removeConnection = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
        );

      if (error) throw error;

      setStatus("none");
      toast.success("Connection removed");
      onConnectionChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove connection");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading...
      </Button>
    );
  }

  const buttonContent = () => {
    switch (status) {
      case "none":
        return (
          <Button
            onClick={sendConnectionRequest}
            disabled={actionLoading}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {actionLoading ? "Sending..." : "Connect"}
          </Button>
        );
      case "pending_sent":
        return (
          <Button
            onClick={cancelConnectionRequest}
            disabled={actionLoading}
            variant="outline"
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            {actionLoading ? "Cancelling..." : "Pending"}
          </Button>
        );
      case "pending_received":
        return (
          <div className="flex gap-2">
            <Button
              onClick={acceptConnectionRequest}
              disabled={actionLoading}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              {actionLoading ? "Accepting..." : "Accept"}
            </Button>
            <Button
              onClick={cancelConnectionRequest}
              disabled={actionLoading}
              variant="outline"
              size="icon"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        );
      case "connected":
        return (
          <Button
            onClick={removeConnection}
            disabled={actionLoading}
            variant="secondary"
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            {actionLoading ? "Removing..." : "Connected"}
          </Button>
        );
    }
  };

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
    >
      {buttonContent()}
    </motion.div>
  );
};

export default ConnectionButton;
