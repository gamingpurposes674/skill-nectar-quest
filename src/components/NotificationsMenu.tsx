import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NotificationsMenu = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // First get user's projects
      const { data: userProjects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title")
        .eq("user_id", user.id);

      if (projectsError) throw projectsError;
      
      if (!userProjects || userProjects.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const projectIds = userProjects.map(p => p.id);
      const projectsMap = new Map(userProjects.map(p => [p.id, p]));

      // Get pending collaboration requests for user's projects
      const { data: requestsData, error: requestsError } = await supabase
        .from("collaboration_requests")
        .select("*")
        .in("project_id", projectIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      
      if (!requestsData || requestsData.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Get requester profiles
      const requesterIds = [...new Set(requestsData.map(r => r.requester_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", requesterIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      // Merge data
      const notificationsWithData = requestsData.map(request => ({
        ...request,
        projects: projectsMap.get(request.project_id) || null,
        profiles: profilesMap.get(request.requester_id) || null
      }));

      setNotifications(notificationsWithData);
      setUnreadCount(notificationsWithData.length);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('collaboration-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaboration_requests'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleResponse = async (requestId: string, status: 'accepted' | 'rejected', projectId?: string, requesterId?: string) => {
    setLoading(true);
    try {
      // Update the request status
      const { error } = await supabase
        .from("collaboration_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      // If accepted, set the collaborator_id on the project
      if (status === 'accepted' && projectId && requesterId) {
        const { error: projectError } = await supabase
          .from("projects")
          .update({ 
            collaborator_id: requesterId,
            collaboration_open: false // Close to new collaborators
          })
          .eq("id", projectId);

        if (projectError) throw projectError;
      }

      toast.success(status === 'accepted' ? "Collaboration request accepted! You can now chat and work together." : "Request rejected");
      loadNotifications();
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Card key={notification.id} className="p-4 rounded-none border-0 shadow-none">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={notification.profiles?.avatar_url} />
                      <AvatarFallback>
                        {notification.profiles?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">
                          {notification.profiles?.full_name || "Someone"}
                        </span>
                        {" wants to collaborate on your project "}
                        <span className="font-semibold">
                          {notification.projects?.title}
                        </span>
                      </p>
                      
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          "{notification.message}"
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="gradient-primary"
                          onClick={() => handleResponse(notification.id, 'accepted', notification.project_id, notification.requester_id)}
                          disabled={loading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResponse(notification.id, 'rejected')}
                          disabled={loading}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsMenu;
