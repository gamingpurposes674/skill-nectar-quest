import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  GraduationCap, 
  Award, 
  Github, 
  Linkedin, 
  ExternalLink,
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  ThumbsUp,
  Smile,
  Heart,
  Meh,
  Frown,
  MessageSquare
} from "lucide-react";
import PortfolioHealthIndicator from "@/components/PortfolioHealthIndicator";
import ReactionsAndComments from "@/components/ReactionsAndComments";
import EditProfileDialog from "@/components/EditProfileDialog";
import AddAchievementDialog from "@/components/AddAchievementDialog";
import SendAdviceDialog from "@/components/SendAdviceDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reactions, setReactions] = useState<{[key: string]: number}>({});
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddAchievementDialog, setShowAddAchievementDialog] = useState(false);
  const [portfolioHealth, setPortfolioHealth] = useState(0);

  const profileId = id || user?.id;
  const isOwnProfile = user?.id === profileId;

  useEffect(() => {
    if (profileId) {
      loadProfileData();
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

      // Load user's projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("profile_id", profileId)
        .order("date_achieved", { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Calculate portfolio health dynamically based on APPROVED project sizes only
      const approvedProjects = (projectsData || []).filter(p => p.validation_status === 'approved');
      const approvedAchievements = (achievementsData || []).filter(a => a.validation_status === 'approved');
      
      const projectProgress = approvedProjects.reduce((total, project) => {
        if (project.project_size === 'major') return total + 5;
        return total + 1.5;
      }, 0);
      
      const achievementProgress = approvedAchievements.length * 1.5;
      const health = Math.min(projectProgress + achievementProgress, 100);
      setPortfolioHealth(health);

      // Update portfolio health in database
      if (isOwnProfile && health !== profileData.portfolio_health) {
        await supabase
          .from("profiles")
          .update({ portfolio_health: health })
          .eq("id", profileId);
      }

      // Load feedback reactions count
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("reaction_type")
        .eq("profile_id", profileId);

      if (!feedbackError && feedbackData) {
        const counts = feedbackData.reduce((acc, item) => {
          if (item.reaction_type) {
            acc[item.reaction_type] = (acc[item.reaction_type] || 0) + 1;
          }
          return acc;
        }, {} as any);
        
        setReactions({
          thumbsUp: counts.thumbsUp || 0,
          flame: counts.flame || 0,
          lightbulb: counts.lightbulb || 0,
          message: counts.message || 0
        });
      }

    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (reactionType: string) => {
    if (!user) {
      toast.error("Please sign in to react");
      return;
    }

    try {
      // If user already reacted, remove or update reaction
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
          toast.success("Reaction removed!");
        } else {
          // Update reaction
          await supabase
            .from("feedback")
            .update({ reaction_type: reactionType })
            .eq("profile_id", profileId)
            .eq("author_id", user.id)
            .eq("reaction_type", userReaction);
          setUserReaction(reactionType);
          toast.success("Reaction updated!");
        }
      } else {
        // Add new reaction
        const { error } = await supabase
          .from("feedback")
          .insert({
            profile_id: profileId,
            author_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
        setUserReaction(reactionType);
        toast.success("Reaction added!");
      }

      loadProfileData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          profile_id: profileId,
          author_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      toast.success("Comment posted!");
      setNewComment("");
      loadProfileData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Project deleted successfully!");
      loadProfileData();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", achievementId);

      if (error) throw error;

      toast.success("Achievement deleted successfully!");
      loadProfileData();
    } catch (error: any) {
      console.error("Error deleting achievement:", error);
      toast.error("Failed to delete achievement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground mb-4">This profile doesn't exist</p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          {isOwnProfile && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card shadow-elegant p-6 animate-fade-in">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback>{profile.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                    {profile.grade && (
                      <Badge variant={
                        (profile.grade.toLowerCase().includes('college') || 
                         profile.grade.toLowerCase().includes('pass') ||
                         profile.grade === '12' ||
                         parseInt(profile.grade) > 12) ? "default" : "secondary"
                      }>
                        {(profile.grade.toLowerCase().includes('college') || 
                          profile.grade.toLowerCase().includes('pass') ||
                          profile.grade === '12' ||
                          parseInt(profile.grade) > 12) ? "SENIOR" : "STUDENT"}
                      </Badge>
                    )}
                  </div>
                  
                  {profile.age && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Age: {profile.age}
                    </p>
                  )}
                  
                  {profile.grade && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <GraduationCap className="h-4 w-4" />
                      Grade: {profile.grade}
                    </p>
                  )}
                  
                  {profile.major && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Major/Dream Major:</span> {profile.major}
                    </p>
                  )}
                  
                  {profile.school && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">School:</span> {profile.school}
                    </p>
                  )}
                  
                  {profile.dream_college && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Dream College:</span> {profile.dream_college}
                    </p>
                  )}
                  
                  {profile.location && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {profile.location}
                    </p>
                  )}
                </div>

                {profile.bio && (
                  <div className="w-full">
                    <h3 className="font-semibold text-sm mb-1">About</h3>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {profile.bio}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </Card>

            <PortfolioHealthIndicator score={portfolioHealth} />
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about" className="animate-slide-up">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 mt-6">
                {profile.skills && profile.skills.length > 0 && (
                  <Card className="glass-card shadow-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Skills & Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {profile.school && (
                  <Card className="glass-card shadow-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Education</h3>
                    <div className="space-y-2">
                      <p className="font-medium">{profile.school}</p>
                      {profile.grade && <p className="text-sm text-muted-foreground">{profile.grade}</p>}
                      {profile.location && <p className="text-sm text-muted-foreground">{profile.location}</p>}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="projects" className="space-y-4 mt-6">
                {projects.length === 0 ? (
                  <Card className="glass-card shadow-card p-8 text-center">
                    <p className="text-muted-foreground">No projects yet</p>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <Card key={project.id} className="glass-card shadow-card p-6 hover:shadow-elegant transition-all duration-300">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-lg">{project.title}</h4>
                            {project.project_size && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {project.project_size}
                              </Badge>
                            )}
                            {project.validation_status && (
                              <Badge 
                                variant={project.validation_status === 'approved' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {project.validation_status}
                              </Badge>
                            )}
                            {project.collaboration_open && project.validation_status === 'approved' && (
                              <Badge variant="secondary" className="text-xs">
                                Open for Collaboration
                              </Badge>
                            )}
                          </div>
                          {project.validation_status !== 'approved' && (
                            <p className="text-xs text-destructive mb-2">
                              Not counted — Invalid or irrelevant submission
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          {project.project_link && (
                            <a 
                              href={project.project_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              View Project →
                            </a>
                          )}
                          {project.proof_file_url && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">Proof of Work:</p>
                              {project.proof_file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img 
                                  src={project.proof_file_url} 
                                  alt="Project proof" 
                                  className="w-full max-w-md h-48 object-cover rounded border"
                                />
                              ) : (
                                <a 
                                  href={project.proof_file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Document
                                </a>
                              )}
                            </div>
                          )}
                          {project.required_skills && project.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {project.required_skills.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge>{project.status}</Badge>
                          {project.validation_status && project.validation_status !== 'approved' && (
                            <Badge variant={project.validation_status === 'pending' ? 'outline' : 'destructive'}>
                              {project.validation_status}
                            </Badge>
                          )}
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProject(project.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4 mt-6">
                {isOwnProfile && (
                  <Button 
                    onClick={() => setShowAddAchievementDialog(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Achievement
                  </Button>
                )}
                
                {achievements.length === 0 ? (
                  <Card className="glass-card shadow-card p-8 text-center">
                    <p className="text-muted-foreground">No achievements yet</p>
                  </Card>
                ) : (
                  <Card className="glass-card shadow-card p-6">
                    <ul className="space-y-3">
                      {achievements.map((achievement) => (
                        <li key={achievement.id} className="flex items-start gap-3 group">
                          <Award className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{achievement.title}</p>
                              {achievement.validation_status && (
                                <Badge 
                                  variant={achievement.validation_status === 'approved' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {achievement.validation_status}
                                </Badge>
                              )}
                            </div>
                            {achievement.validation_status !== 'approved' && (
                              <p className="text-xs text-destructive mt-1">
                                Not counted — Invalid or irrelevant submission
                              </p>
                            )}
                            {achievement.description && (
                              <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                            )}
                            {achievement.date_achieved && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(achievement.date_achieved).toLocaleDateString()}
                              </p>
                            )}
                            {achievement.proof_file_url && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Proof:</p>
                                {achievement.proof_file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img 
                                    src={achievement.proof_file_url} 
                                    alt="Achievement proof" 
                                    className="w-full max-w-sm h-32 object-cover rounded border"
                                  />
                                ) : (
                                  <a 
                                    href={achievement.proof_file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View Document
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {!isOwnProfile && (
              <>
                <SendAdviceDialog 
                  recipientId={profileId}
                  recipientName={profile.full_name}
                  currentUserId={user?.id || ""}
                />
                <ReactionsAndComments
                  reactions={reactions}
                  comments={comments}
                  userReaction={userReaction}
                  onReact={handleReact}
                  onPostComment={handlePostComment}
                  newComment={newComment}
                  onCommentChange={setNewComment}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <EditProfileDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        profile={profile}
        onSuccess={loadProfileData}
      />

      <AddAchievementDialog
        open={showAddAchievementDialog}
        onOpenChange={setShowAddAchievementDialog}
        onSuccess={loadProfileData}
      />
    </div>
  );
};

export default Profile;
