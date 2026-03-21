import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Briefcase,
  Link as LinkIcon,
  Github,
  Linkedin,
  Globe,
  Trash2,
  Edit,
  Users,
  Star,
  Award,
  Zap,
  Trophy,
  Pin,
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import EditProfileDialog from "@/components/EditProfileDialog";
import AddAchievementDialog from "@/components/AddAchievementDialog";
import AvatarSelector from "@/components/AvatarSelector";
import SendAdviceDialog from "@/components/SendAdviceDialog";
import ReactionsAndComments from "@/components/ReactionsAndComments";
import ConnectionButton from "@/components/ConnectionButton";
import { useVerifiedSkills, useCollabScore } from "@/hooks/use-collab-data";
import { CheckCircle2, Shield } from "lucide-react";
import { toTitleCase } from "@/lib/textValidation";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  grade: string | null;
  major: string | null;
  school: string | null;
  dream_college: string | null;
  location: string | null;
  portfolio_health: number | null;
  skills: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  is_public: boolean | null;
  age: number | null;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  validation_status: string;
  required_skills: string[] | null;
  project_link: string | null;
  created_at: string;
  collaborator_id: string | null;
  is_complete: boolean | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  date_achieved: string | null;
  validation_status: string;
  proof_file_url: string | null;
}

// Auto-generated badges based on user data
const computeBadges = (
  projects: Project[],
  achievements: Achievement[],
  connectionsCount: number
) => {
  const badges: { icon: typeof Star; label: string; color: string }[] = [];

  const collabProjects = projects.filter((p) => p.collaborator_id);
  if (collabProjects.length >= 1) {
    badges.push({ icon: Zap, label: "First Collaboration", color: "text-accent" });
  }

  const completedCount = projects.filter((p) => p.is_complete).length;
  if (completedCount >= 5) {
    badges.push({ icon: Trophy, label: "5 Projects Completed", color: "text-yellow-400" });
  } else if (completedCount >= 1) {
    badges.push({ icon: Award, label: "Project Finisher", color: "text-primary" });
  }

  if (connectionsCount >= 10) {
    badges.push({ icon: Users, label: "Top Contributor", color: "text-secondary" });
  }

  if (achievements.length >= 3) {
    badges.push({ icon: Star, label: "Achiever", color: "text-yellow-400" });
  }

  return badges;
};

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [featuredProjectId, setFeaturedProjectId] = useState<string | null>(null);

  // Reactions & comments state
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<any[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const profileId = id || user?.id;
  const isOwnProfile = !id || id === user?.id;
  const { verifiedSkills } = useVerifiedSkills(profileId);
  const { score: collabScore, tier: collabTier, tierColor: collabTierColor } = useCollabScore(profileId);

  useEffect(() => {
    if (profileId) {
      loadProfileData();
      loadConnectionsCount();
    }
  }, [profileId]);

  // Persist featured project in localStorage per-user
  useEffect(() => {
    if (isOwnProfile && user?.id) {
      const saved = localStorage.getItem(`nexstep_featured_${user.id}`);
      if (saved) setFeaturedProjectId(saved);
    }
  }, [isOwnProfile, user?.id]);

  const loadProfileData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);

      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      setAchievements(achievementsData || []);

      // Load reactions
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*, profiles:author_id!feedback_author_id_fkey(full_name, avatar_url, grade)")
        .eq("profile_id", profileId);

      if (feedbackData) {
        const reactionCounts: { [key: string]: number } = {};
        const commentsList: any[] = [];

        feedbackData.forEach((item) => {
          if (item.reaction_type) {
            reactionCounts[item.reaction_type] =
              (reactionCounts[item.reaction_type] || 0) + 1;
            if (user && item.author_id === user.id) {
              setUserReaction(item.reaction_type);
            }
          }
          if (item.comment) {
            commentsList.push(item);
          }
        });

        setReactions(reactionCounts);
        setComments(commentsList);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionsCount = async () => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select("id")
        .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
        .eq("status", "accepted");

      if (!error && data) setConnectionsCount(data.length);
    } catch (error) {
      console.error("Error loading connections count:", error);
    }
  };

  const handleReact = async (reactionType: string) => {
    if (!user || !profileId || isOwnProfile) {
      if (isOwnProfile) toast.error("You cannot react to your own profile");
      return;
    }
    try {
      if (userReaction) {
        if (userReaction === reactionType) {
          await supabase
            .from("feedback")
            .delete()
            .eq("profile_id", profileId)
            .eq("author_id", user.id)
            .eq("reaction_type", userReaction);
          setUserReaction(null);
          setReactions((prev) => ({
            ...prev,
            [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1),
          }));
        } else {
          await supabase
            .from("feedback")
            .update({ reaction_type: reactionType })
            .eq("profile_id", profileId)
            .eq("author_id", user.id)
            .eq("reaction_type", userReaction);
          setReactions((prev) => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
            [reactionType]: (prev[reactionType] || 0) + 1,
          }));
          setUserReaction(reactionType);
        }
      } else {
        await supabase.from("feedback").insert({
          profile_id: profileId,
          author_id: user.id,
          reaction_type: reactionType,
        });
        setReactions((prev) => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1,
        }));
        setUserReaction(reactionType);
        if (profileId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: profileId,
            type: "new_reaction",
            title: "New Reaction",
            message: `Someone reacted to your profile`,
            from_user_id: user.id,
            reference_type: "profile",
            reference_id: profileId,
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to react");
    }
  };

  const handlePostComment = async (commentType: "student" | "graduate") => {
    if (!user || !profileId || !newComment.trim() || isOwnProfile) {
      if (isOwnProfile) toast.error("You cannot comment on your own profile");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("feedback")
        .insert({
          profile_id: profileId,
          author_id: user.id,
          comment: newComment.trim(),
        })
        .select("*, profiles:author_id!feedback_author_id_fkey(full_name, avatar_url, grade)")
        .single();
      if (error) throw error;
      setComments((prev) => [data, ...prev]);
      setNewComment("");
      if (profileId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: profileId,
          type: "new_feedback",
          title: "New Feedback",
          message: `Someone left feedback on your profile`,
          from_user_id: user.id,
          reference_type: "profile",
          reference_id: profileId,
        });
      }
      toast.success("Feedback posted");
    } catch (error: any) {
      toast.error(error.message || "Failed to post feedback");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (featuredProjectId === projectId) {
        setFeaturedProjectId(null);
        if (user?.id) localStorage.removeItem(`nexstep_featured_${user.id}`);
      }
      toast.success("Project deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    try {
      const { error } = await supabase.from("achievements").delete().eq("id", achievementId);
      if (error) throw error;
      setAchievements((prev) => prev.filter((a) => a.id !== achievementId));
      toast.success("Achievement deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete achievement");
    }
  };

  const handleSetFeatured = (projectId: string) => {
    const newId = featuredProjectId === projectId ? null : projectId;
    setFeaturedProjectId(newId);
    if (user?.id) {
      if (newId) {
        localStorage.setItem(`nexstep_featured_${user.id}`, newId);
      } else {
        localStorage.removeItem(`nexstep_featured_${user.id}`);
      }
    }
    toast.success(newId ? "Project pinned as featured" : "Featured project unpinned");
  };

  const getStatusBadge = (grade: string | null) => {
    if (!grade) return { label: "Student", variant: "secondary" as const };
    const gradeLower = grade.toLowerCase();
    if (
      gradeLower.includes("graduate") ||
      gradeLower.includes("college") ||
      gradeLower.includes("university")
    ) {
      return { label: "Senior", variant: "default" as const };
    }
    return { label: "Student", variant: "secondary" as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(profile.grade);
  const badges = computeBadges(projects, achievements, connectionsCount);

  // Separate featured project
  const featuredProject = projects.find((p) => p.id === featuredProjectId);
  const otherProjects = projects.filter((p) => p.id !== featuredProjectId);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const ProjectCard = ({
    project,
    featured = false,
  }: {
    project: Project;
    featured?: boolean;
  }) => (
    <div
      className={`rounded-xl border bg-card p-5 transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_hsl(var(--accent)/0.15)] ${
        featured
          ? "border-accent/30 shadow-[0_0_20px_hsl(var(--accent)/0.1)]"
          : "border-border/50"
      }`}
    >
      {featured && (
        <div className="flex items-center gap-1.5 mb-3 text-accent">
          <Pin className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Featured Project
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3
              className={`font-bold tracking-tight font-['Space_Grotesk',sans-serif] break-words ${
                featured ? "text-base" : "text-[14px]"
              }`}
            >
              {toTitleCase(project.title)}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                project.is_complete
                  ? "bg-accent/10 text-accent border-accent/30"
                  : project.status === "open"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border/60"
              }`}
            >
              {project.is_complete
                ? "Completed"
                : project.status === "open"
                ? "Active"
                : project.status}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {project.description}
          </p>
          {project.required_skills && project.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {project.required_skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {project.project_link && (
            <a
              href={project.project_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-accent hover:underline underline-offset-2 font-medium"
            >
              <LinkIcon className="h-3 w-3" />
              View Project
            </a>
          )}
        </div>
        {isOwnProfile && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => handleSetFeatured(project.id)}
              className={`p-1.5 rounded-md transition-colors ${
                featuredProjectId === project.id
                  ? "text-accent bg-accent/10"
                  : "text-muted-foreground hover:text-accent hover:bg-accent/10"
              }`}
              title={
                featuredProjectId === project.id ? "Unpin featured" : "Pin as featured"
              }
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient glow */}
      <div className="glow-orb w-80 h-80 bg-primary/15 -top-40 -left-40 fixed" />
      <div className="glow-orb w-60 h-60 bg-secondary/10 top-1/4 -right-32 fixed" />

      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-semibold text-foreground">Profile</h1>
          </div>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Left Column: Profile Info ── */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            {/* Profile Card */}
            <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-2 ring-2 ring-border shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 font-bold">
                  {profile.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button
                  onClick={() => setAvatarSelectorOpen(true)}
                  className="text-[11px] text-primary hover:underline mb-3 inline-block"
                >
                  Change Avatar
                </button>
              )}

              <h2 className="text-lg font-bold tracking-tight font-['Space_Grotesk',sans-serif] mb-0.5 flex items-center justify-center gap-2">
                {profile.full_name}
                {collabScore > 0 && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${collabTierColor} bg-muted/30 border-border/50`}>
                    <Shield className="h-3 w-3" />
                    {collabTier}
                  </span>
                )}
              </h2>
              <Badge variant={status.variant} className="text-[10px] mb-3">
                {status.label}
              </Badge>

              {profile.bio && (
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 max-w-[280px] mx-auto">
                  {profile.bio}
                </p>
              )}

              {/* Info rows */}
              <div className="space-y-1.5 text-[13px] text-left px-2">
                {profile.grade && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{profile.grade}</span>
                  </div>
                )}
                {profile.school && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{profile.school}</span>
                  </div>
                )}
                {profile.major && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{profile.major}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex justify-center gap-1.5 mt-4">
                {profile.github_url && (
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {profile.linkedin_url && (
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {profile.portfolio_url && (
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Collab Score */}
              {collabScore > 0 && (
                <div className="mt-5 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-muted-foreground font-medium">Collab Score</span>
                    <span className={`font-bold ${collabTierColor}`}>{collabScore}</span>
                  </div>
                </div>
              )}

              {/* Portfolio Health */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-muted-foreground font-medium">Portfolio Health</span>
                  <span className="font-bold text-foreground">
                    {profile.portfolio_health || 0}%
                  </span>
                </div>
                <AnimatedProgress value={profile.portfolio_health || 0} className="h-1.5" />
              </div>

              {/* Connections */}
              <div className="flex items-center justify-center gap-1.5 mt-4 text-[12px] text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {connectionsCount} connection{connectionsCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && user && (
                <div className="mt-5 space-y-2">
                  <ConnectionButton
                    currentUserId={user.id}
                    targetUserId={profile.id}
                    targetUserName={profile.full_name}
                    onConnectionChange={loadConnectionsCount}
                  />
                  <SendAdviceDialog
                    recipientId={profile.id}
                    recipientName={profile.full_name}
                    currentUserId={user.id}
                  />
                </div>
              )}
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h3 className="text-[13px] font-semibold mb-3 text-foreground">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, i) => {
                    const isVerified = verifiedSkills.has(skill);
                    return (
                      <span
                        key={i}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                          isVerified
                            ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_8px_hsl(var(--accent)/0.2)]"
                            : "bg-muted/50 text-muted-foreground border border-border/60"
                        }`}
                      >
                        {skill}
                        {isVerified && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h3 className="text-[13px] font-semibold mb-3 text-foreground">Badges</h3>
                <div className="space-y-2">
                  {badges.map((badge, i) => {
                    const Icon = badge.icon;
                    return (
                      <motion.div
                        key={i}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/40"
                        initial={prefersReducedMotion ? undefined : { opacity: 0, x: -8 }}
                        animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <Icon className={`h-4 w-4 ${badge.color}`} />
                        <span className="text-[12px] font-medium text-foreground">
                          {badge.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Right Column: Projects & Content ── */}
          <motion.div
            className="lg:col-span-2 space-y-5"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            {/* Featured Project */}
            {featuredProject && (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              >
                <ProjectCard project={featuredProject} featured />
              </motion.div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="projects">
              <TabsList className="bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/40">
                <TabsTrigger
                  value="projects"
                  className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--accent)/0.4)] transition-all duration-200 text-[13px]"
                >
                  Projects ({projects.length})
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--accent)/0.4)] transition-all duration-200 text-[13px]"
                >
                  Achievements ({achievements.length})
                </TabsTrigger>
                {!isOwnProfile && (
                  <TabsTrigger
                    value="feedback"
                    className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--accent)/0.4)] transition-all duration-200 text-[13px]"
                  >
                    Feedback
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="projects" className="mt-4 space-y-3">
                {otherProjects.length === 0 && !featuredProject ? (
                  <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No projects yet</p>
                  </div>
                ) : (
                  otherProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={
                        prefersReducedMotion ? undefined : { opacity: 0, y: 12 }
                      }
                      animate={
                        prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                      }
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <ProjectCard project={project} />
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="achievements" className="mt-4 space-y-3">
                {isOwnProfile && (
                  <Button
                    onClick={() => setAchievementDialogOpen(true)}
                    size="sm"
                    className="mb-2 gradient-primary text-xs h-8"
                  >
                    Add Achievement
                  </Button>
                )}
                {achievements.length === 0 ? (
                  <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No achievements yet</p>
                  </div>
                ) : (
                  achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={
                        prefersReducedMotion ? undefined : { opacity: 0, y: 12 }
                      }
                      animate={
                        prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                      }
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_hsl(var(--accent)/0.15)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="text-[14px] font-bold tracking-tight font-['Space_Grotesk',sans-serif] mb-1">
                              {achievement.title}
                            </h3>
                            {achievement.description && (
                              <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                                {achievement.description}
                              </p>
                            )}
                            {achievement.date_achieved && (
                              <p className="text-[11px] text-muted-foreground/60">
                                {new Date(achievement.date_achieved).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {isOwnProfile && (
                            <button
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {!isOwnProfile && (
                <TabsContent value="feedback" className="mt-4">
                  <ReactionsAndComments
                    reactions={reactions}
                    comments={comments}
                    userReaction={userReaction}
                    onReact={handleReact}
                    onPostComment={handlePostComment}
                    newComment={newComment}
                    onCommentChange={setNewComment}
                  />
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        </motion.div>
      </main>

      {/* Dialogs */}
      {isOwnProfile && (
        <>
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            profile={profile}
            onSuccess={loadProfileData}
          />
          <AddAchievementDialog
            open={achievementDialogOpen}
            onOpenChange={setAchievementDialogOpen}
            onSuccess={loadProfileData}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;
