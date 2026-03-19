import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Bell,
  Check,
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Heart,
  FolderOpen,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import CollaborationCelebration from "@/components/CollaborationCelebration";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  from_user_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
  from_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface CollaborationRequest {
  id: string;
  project_id: string;
  requester_id: string;
  status: string;
  message: string | null;
  created_at: string;
  projects?: { title: string };
  profiles?: { full_name: string; avatar_url: string | null };
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester_profile?: { full_name: string; avatar_url: string | null };
}

const NotificationsMenu = () => {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    open: boolean;
    projectTitle: string;
    creatorName: string;
    creatorAvatar: string | null;
    collaboratorName: string;
    collaboratorAvatar: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadCollaborationRequests();
      loadConnectionRequests();

      // Real-time subscriptions
      const notificationsChannel = supabase
        .channel("notifications-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => {
            loadNotifications();
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1000);
          }
        )
        .subscribe();

      const collaborationChannel = supabase
        .channel("collaboration-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "collaboration_requests" },
          () => {
            loadCollaborationRequests();
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1000);
          }
        )
        .subscribe();

      const connectionChannel = supabase
        .channel("connection-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "connections" },
          () => {
            loadConnectionRequests();
            setHasNewNotification(true);
            setTimeout(() => setHasNewNotification(false), 1000);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(collaborationChannel);
        supabase.removeChannel(connectionChannel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      // Load from_user profiles
      const withProfiles = await Promise.all(
        data.map(async (notif) => {
          if (notif.from_user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", notif.from_user_id)
              .single();
            return { ...notif, from_profile: profile };
          }
          return notif;
        })
      );
      setNotifications(withProfiles);
    }
  };

  const loadCollaborationRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("collaboration_requests")
      .select(`
        *,
        projects:project_id(title, user_id)
      `)
      .eq("status", "pending");

    if (!error && data) {
      const myRequests = (data as any[]).filter((req) => req.projects?.user_id === user.id);
      const requestsWithProfiles = await Promise.all(
        myRequests.map(async (req) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", req.requester_id)
            .single();
          return {
            ...req,
            profiles: profileData || { full_name: "Unknown", avatar_url: "" },
          };
        })
      );
      setCollaborationRequests(requestsWithProfiles);
    }
  };

  const loadConnectionRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (!error && data) {
      // Load requester profiles
      const withProfiles = await Promise.all(
        data.map(async (conn) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", conn.requester_id)
            .single();
          return { ...conn, requester_profile: profile };
        })
      );
      setConnectionRequests(withProfiles);
    }
  };

  const handleCollaborationResponse = async (
    requestId: string,
    status: "accepted" | "rejected",
    projectId?: string,
    requesterId?: string,
    projectTitle?: string
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("collaboration_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;

      if (status === "accepted" && projectId && requesterId) {
        await supabase.from("projects").update({ collaborator_id: requesterId, status: "in_progress" }).eq("id", projectId);

        // Show celebration
        const { data: myProfile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user!.id).single();
        const { data: requesterProfile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", requesterId).single();

        setCelebrationData({
          open: true,
          projectTitle: projectTitle || "Project",
          creatorName: myProfile?.full_name || "You",
          creatorAvatar: myProfile?.avatar_url || null,
          collaboratorName: requesterProfile?.full_name || "Collaborator",
          collaboratorAvatar: requesterProfile?.avatar_url || null,
        });
      }

      toast.success(`Request ${status}`);
      loadCollaborationRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to respond");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionResponse = async (connectionId: string, requesterId: string, status: "accepted" | "rejected") => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", connectionId);

      if (error) throw error;

      if (status === "accepted" && user) {
        // Notify the requester
        const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

        await supabase.from("notifications").insert({
          user_id: requesterId,
          type: "connection_accepted",
          title: "Connection Accepted",
          message: `${myProfile?.full_name || "Someone"} accepted your connection request`,
          from_user_id: user.id,
          reference_type: "connection",
        });
      }

      toast.success(`Connection ${status}`);
      loadConnectionRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to respond");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "connection_request":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "connection_accepted":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "new_feedback":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "new_reaction":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "project_update":
        return <FolderOpen className="h-4 w-4 text-orange-500" />;
      case "portfolio_update":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const totalUnread =
    notifications.filter((n) => !n.read).length + collaborationRequests.length + connectionRequests.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <motion.div
            animate={hasNewNotification && !prefersReducedMotion ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-5 w-5" />
          </motion.div>
          <AnimatePresence>
            {totalUnread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalUnread > 9 ? "9+" : totalUnread}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="h-96">
          {connectionRequests.length === 0 && collaborationRequests.length === 0 && notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Connection Requests */}
              {connectionRequests.map((request) => (
                <motion.div
                  key={`conn-${request.id}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.requester_profile?.avatar_url || undefined} />
                      <AvatarFallback>{request.requester_profile?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UserPlus className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Connection Request</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.requester_profile?.full_name} wants to connect
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() => handleConnectionResponse(request.id, request.requester_id, "accepted")}
                          disabled={loading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => handleConnectionResponse(request.id, request.requester_id, "rejected")}
                          disabled={loading}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Collaboration Requests */}
              {collaborationRequests.map((request) => (
                <motion.div
                  key={`collab-${request.id}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{request.profiles?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderOpen className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Collaboration Request</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.profiles?.full_name} wants to join "{request.projects?.title}"
                      </p>
                      {request.message && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{request.message}"</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() =>
                            handleCollaborationResponse(request.id, "accepted", request.project_id, request.requester_id, request.projects?.title)
                          }
                          disabled={loading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => handleCollaborationResponse(request.id, "rejected")}
                          disabled={loading}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* General Notifications */}
              {notifications.map((notification) => (
                <motion.div
                  key={`notif-${notification.id}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notification.from_profile ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.from_profile.avatar_url || undefined} />
                        <AvatarFallback>{notification.from_profile.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <span className="text-sm font-medium">{notification.title}</span>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Collaboration Celebration */}
    {celebrationData && (
      <CollaborationCelebration
        open={celebrationData.open}
        onClose={() => setCelebrationData(null)}
        projectTitle={celebrationData.projectTitle}
        creatorName={celebrationData.creatorName}
        creatorAvatar={celebrationData.creatorAvatar}
        collaboratorName={celebrationData.collaboratorName}
        collaboratorAvatar={celebrationData.collaboratorAvatar}
      />
    )}
    </>
  );
};

export default NotificationsMenu;
