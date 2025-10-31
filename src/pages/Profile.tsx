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
  Edit
} from "lucide-react";
import PortfolioHealthIndicator from "@/components/PortfolioHealthIndicator";
import FeedbackPanel from "@/components/FeedbackPanel";
import EditProfileDialog from "@/components/EditProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reactions, setReactions] = useState({ thumbsUp: 0, flame: 0, lightbulb: 0, message: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const handleReact = async (type: string) => {
    if (!user) {
      toast.error("Please sign in to react");
      return;
    }

    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          profile_id: profileId,
          author_id: user.id,
          reaction_type: type
        });

      if (error) throw error;

      setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
      toast.success("Reaction added!");
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
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
                
                <div>
                  <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                  {profile.grade && (
                    <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <GraduationCap className="h-4 w-4" />
                      {profile.grade}
                    </p>
                  )}
                  {profile.location && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {profile.location}
                    </p>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {profile.bio}
                  </p>
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

            <PortfolioHealthIndicator score={profile.portfolio_health || 0} />
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
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{project.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          {project.required_skills && project.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {project.required_skills.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge>{project.status}</Badge>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4 mt-6">
                {achievements.length === 0 ? (
                  <Card className="glass-card shadow-card p-8 text-center">
                    <p className="text-muted-foreground">No achievements yet</p>
                  </Card>
                ) : (
                  <Card className="glass-card shadow-card p-6">
                    <ul className="space-y-3">
                      {achievements.map((achievement) => (
                        <li key={achievement.id} className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{achievement.title}</p>
                            {achievement.description && (
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            )}
                            {achievement.date_achieved && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(achievement.date_achieved).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {!isOwnProfile && (
              <FeedbackPanel reactions={reactions} onReact={handleReact} />
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
    </div>
  );
};

export default Profile;
