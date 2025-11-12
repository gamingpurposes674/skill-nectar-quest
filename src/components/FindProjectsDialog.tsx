import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Search, Users, Clock, Send } from "lucide-react";

interface FindProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FindProjectsDialog = ({ open, onOpenChange }: FindProjectsDialogProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq("status", "open")
        .eq("validation_status", "approved")
        .neq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (projectId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!requestMessage.trim()) {
      toast.error("Please enter a message with your request");
      return;
    }

    try {
      const { error } = await supabase
        .from("collaboration_requests")
        .insert({
          project_id: projectId,
          requester_id: user.id,
          message: requestMessage,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Collaboration request sent!");
      setSelectedProject(null);
      setRequestMessage("");
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error("Failed to send collaboration request");
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.required_skills?.some((skill: string) => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find Projects to Collaborate On</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={project.profiles?.avatar_url} />
                      <AvatarFallback>{project.profiles?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{project.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            by {project.profiles?.full_name || "Unknown"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.project_size}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.required_skills?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.required_skills?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.required_skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeAgo(project.created_at)}
                        </div>
                        
                        {selectedProject === project.id ? (
                          <div className="flex-1 ml-4 space-y-2">
                            <Textarea
                              placeholder="Why do you want to collaborate on this project?"
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="gradient-primary"
                                onClick={() => handleSendRequest(project.id)}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send Request
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedProject(null);
                                  setRequestMessage("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="gradient-primary"
                            onClick={() => setSelectedProject(project.id)}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Request to Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindProjectsDialog;
