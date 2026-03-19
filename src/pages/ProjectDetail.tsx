import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  ArrowLeft,
  Users,
  Clock,
  ExternalLink,
  Send,
  Pencil,
  Plus,
} from "lucide-react";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { ProjectLogSection, MilestoneTimeline } from "@/components/ProjectLogAndMilestones";
import EditProjectDialog from "@/components/EditProjectDialog";
import { toTitleCase } from "@/lib/textValidation";
import EditProjectDialog from "@/components/EditProjectDialog";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [project, setProject] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [collaborator, setCollaborator] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const { data: proj, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(proj);

      const { data: creatorData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, grade")
        .eq("id", proj.user_id)
        .single();
      setCreator(creatorData);

      if (proj.collaborator_id) {
        const { data: collabData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, grade")
          .eq("id", proj.collaborator_id)
          .single();
        setCollaborator(collabData);
      }

      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("id, author_id, profile_id, project_id, comment, created_at")
        .eq("project_id", id as string)
        .order("created_at", { ascending: true });

      const authorIds = [...new Set((feedbackData || []).map((c: any) => c.author_id).filter(Boolean))];
      const { data: authorProfiles } = authorIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", authorIds)
        : { data: [] as any[] };

      const authorMap = new Map((authorProfiles || []).map((p: any) => [p.id, p]));
      setComments((feedbackData || []).map((c: any) => ({ ...c, author: authorMap.get(c.author_id) })));
    } catch (err) {
      console.error("Error loading project:", err);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!user || !newComment.trim() || !id) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .insert({
          profile_id: project.user_id,
          author_id: user.id,
          comment: newComment.trim(),
          project_id: id,
        })
        .select("id, author_id, profile_id, project_id, comment, created_at")
        .single();

      if (error) throw error;

      if (project.user_id !== user.id) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        await supabase.from("notifications").insert({
          user_id: project.user_id,
          type: "new_feedback",
          title: "New Comment",
          message: `${myProfile?.full_name || "Someone"} commented on "${project.title}"`,
          from_user_id: user.id,
          reference_id: id,
          reference_type: "project",
        });
      }

      if (project.collaborator_id && project.collaborator_id !== user.id) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        await supabase.from("notifications").insert({
          user_id: project.collaborator_id,
          type: "new_feedback",
          title: "New Comment",
          message: `${myProfile?.full_name || "Someone"} commented on "${project.title}"`,
          from_user_id: user.id,
          reference_id: id,
          reference_type: "project",
        });
      }
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setComments((prev) => [...prev, { ...data, author: authorProfile }]);
      setNewComment("");
      toast.success("Comment posted");
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !id) return;
    try {
      const { data: existing } = await supabase
        .from("collaboration_requests")
        .select("id, status")
        .eq("project_id", id)
        .eq("requester_id", user.id)
        .maybeSingle();

      if (existing) {
        toast.error(
          existing.status === "pending"
            ? "You already have a pending request"
            : "Request already processed"
        );
        return;
      }

      const { error } = await supabase.from("collaboration_requests").insert({
        project_id: id,
        requester_id: user.id,
        message: "I'd like to collaborate on your project!",
        status: "pending",
      });
      if (error) throw error;
      toast.success("Collaboration request sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    }
  };

  const getProgress = () => {
    if (!project) return 0;
    if (project.is_complete) return 100;
    if (project.creator_completed && project.collaborator_completed) return 100;
    if (project.creator_completed || project.collaborator_completed) return 75;
    if (project.collaborator_id) return 40;
    if (project.validation_status === "approved") return 15;
    return 5;
  };

  const getStatusLabel = () => {
    if (!project) return "";
    if (project.is_complete) return "Completed";
    if (project.collaborator_id) return "In Progress";
    if (project.collaboration_open) return "Open to Join";
    return project.status || "Draft";
  };

  const getStatusColor = () => {
    const label = getStatusLabel();
    if (label === "Completed") return "bg-accent/10 text-accent border-accent/30";
    if (label === "In Progress") return "bg-secondary/10 text-secondary border-secondary/30";
    if (label === "Open to Join") return "bg-primary/10 text-primary border-primary/30";
    return "bg-muted/50 text-muted-foreground border-border/60";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === project.user_id;
  const isParticipant = isOwner || user?.id === project.collaborator_id;
  const canJoin = project.collaboration_open && !project.is_complete && !project.collaborator_id && !isOwner && user;
  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-3xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
              {toTitleCase(project.title)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowEdit(true)}>
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
            {canJoin && (
              <Button size="sm" onClick={handleJoin} className="h-8 px-4 text-xs font-semibold gradient-primary shadow-glow">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Join Project
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          className="space-y-6"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Section 1: Project Info ── */}
          <section className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1 flex-1">
                <h1 className="text-2xl font-bold tracking-tight font-['Space_Grotesk',sans-serif] text-foreground">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                  {creator && (
                    <Link to={`/profile/${creator.id}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={creator.avatar_url} />
                        <AvatarFallback className="text-[9px]">{creator.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-accent">{creator.full_name}</span>
                    </Link>
                  )}
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  {project.category && (
                    <>
                      <span className="text-border">·</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 border border-border/60">
                        {project.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor()}`}>
                {getStatusLabel()}
              </span>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold text-foreground">{progress}%</span>
              </div>
              <AnimatedProgress value={progress} className="h-2" />
            </div>

            {/* Description */}
            <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>

            {/* Skills */}
            {project.required_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.required_skills.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/25">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {project.project_link && (
              <a href={project.project_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:underline underline-offset-2 font-medium">
                <ExternalLink className="h-3 w-3" />
                View Project Link
              </a>
            )}

            {/* Proof image */}
            {project.proof_file_url && (
              <div>
                <p className="text-[11px] text-muted-foreground font-medium mb-2">Proof / Evidence</p>
                <img src={project.proof_file_url} alt="Project proof" className="rounded-lg max-h-48 object-cover border border-border/30" />
              </div>
            )}
          </section>

          {/* ── Section 2: Project Log ── */}
          <ProjectLogSection
            projectId={id!}
            isParticipant={isParticipant}
            project={project}
          />

          {/* ── Section 3: Milestones ── */}
          <MilestoneTimeline
            projectId={id!}
            isParticipant={isParticipant}
          />

          {/* ── Section 4: Collaborators ── */}
          <section className="rounded-xl border border-border/50 bg-card p-5">
            <h2 className="text-[14px] font-semibold text-foreground mb-3">Collaborators</h2>
            <div className="space-y-2">
              {creator && (
                <Link to={`/profile/${creator.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
                  <Avatar className="h-8 w-8 ring-2 ring-border group-hover:ring-accent/30 transition-all">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback className="text-xs">{creator.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-medium text-foreground group-hover:text-accent transition-colors">{creator.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">Creator · {creator.grade || "Student"}</p>
                  </div>
                </Link>
              )}
              {collaborator && (
                <Link to={`/profile/${collaborator.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
                  <Avatar className="h-8 w-8 ring-2 ring-border group-hover:ring-accent/30 transition-all">
                    <AvatarImage src={collaborator.avatar_url} />
                    <AvatarFallback className="text-xs">{collaborator.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-medium text-foreground group-hover:text-accent transition-colors">{collaborator.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">Collaborator · {collaborator.grade || "Student"}</p>
                  </div>
                </Link>
              )}
              {!collaborator && project.collaboration_open && (
                <p className="text-[12px] text-muted-foreground/60 italic px-2.5">Looking for a collaborator...</p>
              )}
            </div>
          </section>

          {/* ── Section 5: Comments ── */}
          <section className="rounded-xl border border-border/50 bg-card p-5">
            <h2 className="text-[14px] font-semibold text-foreground mb-4">
              Comments ({comments.filter((c) => c.comment).length})
            </h2>

            {user && (
              <div className="flex gap-3 mb-5">
                <Textarea
                  placeholder="Leave a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="text-[13px] bg-muted/30 border-border/50 resize-none"
                />
                <Button size="icon" onClick={handlePostComment} disabled={!newComment.trim() || submitting}
                  className="h-10 w-10 flex-shrink-0 gradient-primary">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {comments.filter((c) => c.comment).length === 0 ? (
                <p className="text-[12px] text-muted-foreground/60 text-center py-4">No comments yet. Be the first!</p>
              ) : (
                comments.filter((c) => c.comment).map((comment, i) => (
                  <motion.div
                    key={comment.id}
                    className="flex gap-3 py-3 border-b border-border/20 last:border-0"
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={comment.author?.avatar_url} />
                      <AvatarFallback className="text-[10px]">{comment.author?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-medium text-foreground">{comment.author?.full_name || "Anonymous"}</span>
                        <span className="text-[10px] text-muted-foreground/50">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{comment.comment}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </motion.div>
      </main>

      {/* Edit Project Dialog */}
      {project && (
        <EditProjectDialog
          open={showEdit}
          onOpenChange={setShowEdit}
          project={project}
          onSuccess={loadProject}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
