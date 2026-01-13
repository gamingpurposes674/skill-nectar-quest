import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import EditProfileDialog from "@/components/EditProfileDialog";
import AddAchievementDialog from "@/components/AddAchievementDialog";
import SendAdviceDialog from "@/components/SendAdviceDialog";
import ReactionsAndComments from "@/components/ReactionsAndComments";
import ConnectionButton from "@/components/ConnectionButton";

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
}

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  date_achieved: string | null;
  validation_status: string;
  proof_file_url: string | null;
}

const Profile = () => {
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

  // Reactions & comments state
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<any[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const profileId = id || user?.id;
  const isOwnProfile = !id || id === user?.id;

  useEffect(() => {
    if (profileId) {
      loadProfileData();
      loadConnectionsCount();
    }
  }, [profileId]);

  const loadProfileData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);

      // Load achievements
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      setAchievements(achievementsData || []);

      // Load reactions
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*, profiles(full_name, avatar_url, grade)")
        .eq("profile_id", profileId);

      if (feedbackData) {
        const reactionCounts: { [key: string]: number } = {};
        const commentsList: any[] = [];

        feedbackData.forEach((item) => {
          if (item.reaction_type) {
            reactionCounts[item.reaction_type] = (reactionCounts[item.reaction_type] || 0) + 1;
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

      if (!error && data) {
        setConnectionsCount(data.length);
      }
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
          // Remove reaction
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
          toast.success("Reaction removed");
        } else {
          // Update reaction
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
          toast.success("Reaction updated");
        }
      } else {
        // Add new reaction
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

        // Create notification
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

        toast.success("Reaction added");
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
        .select("*, profiles(full_name, avatar_url, grade)")
        .single();

      if (error) throw error;

      setComments((prev) => [data, ...prev]);
      setNewComment("");

      // Create notification
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

  const getStatusBadge = (grade: string | null) => {
    if (!grade) return { label: "STUDENT", variant: "secondary" as const };
    const gradeLower = grade.toLowerCase();
    if (gradeLower.includes("graduate") || gradeLower.includes("college") || gradeLower.includes("university")) {
      return { label: "SENIOR", variant: "default" as const };
    }
    return { label: "STUDENT", variant: "secondary" as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading profile...</p>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
          {isOwnProfile && (
            <Button variant="outline" onClick={() => setEditDialogOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1"
          >
            <AnimatedCard className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {profile.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold mb-1">{profile.full_name}</h2>
              <Badge variant={status.variant} className="mb-4">
                {status.label}
              </Badge>

              {profile.bio && <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>}

              <div className="space-y-2 text-sm text-left">
                {profile.grade && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.grade}</span>
                  </div>
                )}
                {profile.major && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.major}</span>
                  </div>
                )}
                {profile.school && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.school}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex justify-center gap-2 mt-4">
                {profile.github_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {profile.linkedin_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {profile.portfolio_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Portfolio Health */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Portfolio Health</span>
                  <span className="font-bold">{profile.portfolio_health || 0}%</span>
                </div>
                <AnimatedProgress value={profile.portfolio_health || 0} className="h-2" />
              </div>

              {/* Connections Count */}
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{connectionsCount} connection{connectionsCount !== 1 ? 's' : ''}</span>
              </div>

              {/* Action Buttons for other profiles */}
              {!isOwnProfile && user && (
                <div className="mt-6 space-y-3">
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
            </AnimatedCard>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <AnimatedCard className="p-6 mt-4">
                <h3 className="font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </AnimatedCard>
            )}
          </motion.div>

          {/* Right Column - Tabs */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="projects">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                <TabsTrigger value="achievements">Achievements ({achievements.length})</TabsTrigger>
                {!isOwnProfile && <TabsTrigger value="feedback">Feedback</TabsTrigger>}
              </TabsList>

              <TabsContent value="projects" className="mt-4 space-y-4">
                {projects.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No projects yet</p>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <AnimatedCard key={project.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{project.title}</h3>
                            <Badge variant="outline">{project.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                          {project.required_skills && project.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.required_skills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {project.project_link && (
                            <a
                              href={project.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                            >
                              <LinkIcon className="h-3 w-3" />
                              View Project
                            </a>
                          )}
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </AnimatedCard>
                  ))
                )}
              </TabsContent>

              <TabsContent value="achievements" className="mt-4 space-y-4">
                {isOwnProfile && (
                  <Button onClick={() => setAchievementDialogOpen(true)} className="mb-4">
                    Add Achievement
                  </Button>
                )}
                {achievements.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No achievements yet</p>
                  </Card>
                ) : (
                  achievements.map((achievement) => (
                    <AnimatedCard key={achievement.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{achievement.title}</h3>
                          {achievement.description && (
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          )}
                          {achievement.date_achieved && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(achievement.date_achieved).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAchievement(achievement.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </AnimatedCard>
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
        </div>
      </main>

      {/* Dialogs */}
      {isOwnProfile && (
        <>
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            profile={profile}
            onProfileUpdate={loadProfileData}
          />
          <AddAchievementDialog
            open={achievementDialogOpen}
            onOpenChange={setAchievementDialogOpen}
            profileId={profile.id}
            onAchievementAdded={loadProfileData}
          />
        </>
      )}
    </div>
  );
};

export default Profile;
