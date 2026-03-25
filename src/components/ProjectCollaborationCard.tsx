import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, CheckCircle, Lock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ProjectChatDialog from "./ProjectChatDialog";

interface ProjectCollaborationCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    user_id: string;
    collaborator_id?: string | null;
    is_complete?: boolean;
    creator_completed?: boolean;
    collaborator_completed?: boolean;
    required_skills?: string[];
    validation_status?: string;
    collaboration_open?: boolean;
  };
  creatorProfile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
  collaboratorProfile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
  onUpdate: () => void;
}

const ProjectCollaborationCard = ({
  project,
  creatorProfile,
  collaboratorProfile,
  onUpdate
}: ProjectCollaborationCardProps) => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [completing, setCompleting] = useState(false);

  const isCreator = user?.id === project.user_id;
  const isCollaborator = user?.id === project.collaborator_id;
  const hasCollaborator = !!project.collaborator_id;
  const isParticipant = isCreator || isCollaborator;

  // Calculate progress (0%, 50%, or 100%)
  const getProgress = () => {
    if (project.is_complete) return 100;
    let progress = 0;
    if (project.creator_completed) progress += 50;
    if (project.collaborator_completed) progress += 50;
    return progress;
  };

  const progress = getProgress();

  // Check if current user has marked complete
  const hasMarkedComplete = isCreator 
    ? project.creator_completed 
    : project.collaborator_completed;

  const handleMarkComplete = async () => {
    if (!user || !isParticipant) return;

    setCompleting(true);
    try {
      const updateField = isCreator ? "creator_completed" : "collaborator_completed";
      
      // Check if both will be complete after this update
      const willBeFullyComplete = isCreator 
        ? project.collaborator_completed 
        : project.creator_completed;

      const updates: any = { [updateField]: true };
      
      if (willBeFullyComplete) {
        updates.is_complete = true;
      }

      const { error: projectError } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", project.id);

      if (projectError) throw projectError;

      // If project is now fully complete, boost both users' portfolio health
      if (willBeFullyComplete) {
        // Boost creator's portfolio health
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("portfolio_health")
          .eq("id", project.user_id)
          .single();

        if (creatorData) {
          const newCreatorHealth = Math.min(100, (creatorData.portfolio_health || 0) + 4);
          await supabase
            .from("profiles")
            .update({ portfolio_health: newCreatorHealth })
            .eq("id", project.user_id);
        }

        // Boost collaborator's portfolio health
        if (project.collaborator_id) {
          const { data: collabData } = await supabase
            .from("profiles")
            .select("portfolio_health")
            .eq("id", project.collaborator_id)
            .single();

          if (collabData) {
            const newCollabHealth = Math.min(100, (collabData.portfolio_health || 0) + 4);
            await supabase
              .from("profiles")
              .update({ portfolio_health: newCollabHealth })
              .eq("id", project.collaborator_id);
          }
        }

        toast.success("Project completed! Both collaborators received +4% portfolio health boost!");
      } else {
        toast.success("Marked as complete. Waiting for your collaborator.");
      }

      onUpdate();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Failed to mark project as complete");
    } finally {
      setCompleting(false);
    }
  };

  const otherUserName = isCreator 
    ? collaboratorProfile?.full_name || "Collaborator"
    : creatorProfile?.full_name || "Creator";

  return (
    <>
      <Card className="glass-card shadow-card p-6 hover:shadow-elegant transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{project.title}</h3>
              {project.is_complete && (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {project.validation_status && project.validation_status !== 'approved' && (
                <Badge variant="destructive" className="text-xs">
                  {project.validation_status}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
          </div>
        </div>

        {/* Creator & Collaborator Info */}
        <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creatorProfile?.avatar_url} />
              <AvatarFallback>{creatorProfile?.full_name?.[0] || "C"}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">ORIGINAL IDEA BY:</span>
            <span className="text-sm font-medium">{creatorProfile?.full_name || "Unknown"}</span>
            {project.creator_completed && !project.is_complete && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          
          {hasCollaborator && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={collaboratorProfile?.avatar_url} />
                <AvatarFallback>{collaboratorProfile?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">COLLABORATOR:</span>
              <span className="text-sm font-medium">{collaboratorProfile?.full_name || "Unknown"}</span>
              {project.collaborator_completed && !project.is_complete && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.required_skills.map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
          </div>
        )}

        {/* Progress Bar (only show if collaboration is active and not complete) */}
        {hasCollaborator && !project.is_complete && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Completion Progress</span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        {isParticipant && hasCollaborator && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(true)}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with {otherUserName}
              {project.is_complete && <Lock className="h-3 w-3 ml-1" />}
            </Button>
            
            {!project.is_complete && !hasMarkedComplete && (
              <Button
                size="sm"
                className=""
                onClick={handleMarkComplete}
                disabled={completing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Project Complete
              </Button>
            )}
            
            {!project.is_complete && hasMarkedComplete && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs">Waiting for partner</span>
              </Badge>
            )}
          </div>
        )}

        {/* Show "Open for Collaboration" if no collaborator yet */}
        {!hasCollaborator && project.collaboration_open && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">Open for collaboration</span>
          </div>
        )}
      </Card>

      <ProjectChatDialog
        open={showChat}
        onOpenChange={setShowChat}
        projectId={project.id}
        projectTitle={project.title}
        otherUserName={otherUserName}
        isLocked={project.is_complete || false}
      />
    </>
  );
};

export default ProjectCollaborationCard;
