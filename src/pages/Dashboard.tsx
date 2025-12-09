import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Users, 
  Target,
  TrendingUp,
  Sparkles,
  BookOpen,
  LogOut,
  ChevronDown,
  Compass
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CollaborationCard from "@/components/CollaborationCard";
import ProjectCollaborationCard from "@/components/ProjectCollaborationCard";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import FindProjectsDialog from "@/components/FindProjectsDialog";
import NotificationsMenu from "@/components/NotificationsMenu";
import PortfolioGapScanner from "@/components/PortfolioGapScanner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [collaborativeProjects, setCollaborativeProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFindProjectsDialog, setShowFindProjectsDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load all validated, collaboration-open projects (feed)
      const { data: feedProjectsData, error: feedProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "open")
        .eq("validation_status", "approved")
        .eq("collaboration_open", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (feedProjectsError) throw feedProjectsError;

      // Fetch profiles for feed projects
      if (feedProjectsData && feedProjectsData.length > 0) {
        const feedUserIds = [...new Set(feedProjectsData.map(p => p.user_id))];
        const { data: feedProfilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", feedUserIds);

        const feedProfilesMap = new Map(
          (feedProfilesData || []).map(p => [p.id, p])
        );

        const feedWithProfiles = feedProjectsData.map(project => ({
          ...project,
          profiles: feedProfilesMap.get(project.user_id) || null
        }));
        setProjects(feedWithProfiles);
      } else {
        setProjects([]);
      }

      // Load user's own projects
      const { data: myProjectsData, error: myProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (myProjectsError) throw myProjectsError;
      setMyProjects(myProjectsData || []);

      // Load projects where user is a collaborator
      const { data: collabProjectsData, error: collabProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("collaborator_id", user?.id)
        .order("created_at", { ascending: false });

      if (collabProjectsError) throw collabProjectsError;

      // Combine projects where user is creator or collaborator with active collaboration
      const allCollaborativeProjects = [
        ...(myProjectsData || []).filter(p => p.collaborator_id),
        ...(collabProjectsData || [])
      ];

      setCollaborativeProjects(allCollaborativeProjects);

      // Load user's achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("profile_id", user?.id);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);
      const allUserIds = new Set<string>();
      allCollaborativeProjects.forEach(p => {
        if (p.user_id) allUserIds.add(p.user_id);
        if (p.collaborator_id) allUserIds.add(p.collaborator_id);
      });

      if (allUserIds.size > 0) {
        const { data: allProfilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(allUserIds));

        const newProfilesMap = new Map(
          (allProfilesData || []).map(p => [p.id, p])
        );
        setProfilesMap(newProfilesMap);
      }

    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    loadData();
    setShowCreateDialog(false);
  };

  const handleRequestCollaboration = async (projectId: string) => {
    if (!user) {
      toast.error("Please sign in to collaborate");
      return;
    }

    try {
      // Check if project already has a collaborator
      const { data: projectData, error: projectCheckError } = await supabase
        .from("projects")
        .select("collaborator_id")
        .eq("id", projectId)
        .single();

      if (projectCheckError) throw projectCheckError;
      
      if (projectData?.collaborator_id) {
        toast.error("This project already has a collaborator");
        return;
      }

      // Check for existing request from this user
      const { data: existingRequest, error: checkError } = await supabase
        .from("collaboration_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("requester_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.error("You already have a pending request for this project");
        } else if (existingRequest.status === 'accepted') {
          toast.info("You're already collaborating on this project!");
        } else {
          toast.error("Your previous request was rejected");
        }
        return;
      }

      const { error } = await supabase
        .from("collaboration_requests")
        .insert({
          project_id: projectId,
          requester_id: user.id,
          message: "I'd like to collaborate on your project!",
          status: "pending"
        });

      if (error) throw error;
      toast.success("Collaboration request sent!");
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error("Failed to send collaboration request");
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard">
            <h1 className="text-xl font-bold text-gradient cursor-pointer">NexStep</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <NotificationsMenu />
            
            <Link to={`/profile/${user?.id}`}>
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </Link>
            
            <Button size="icon" variant="ghost" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <Card className="glass-card shadow-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connections</p>
                    <p className="text-2xl font-bold">
                      {collaborativeProjects.length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="glass-card shadow-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Target className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{myProjects.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="glass-card shadow-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Health</p>
                    <p className="text-2xl font-bold">{profile?.portfolio_health || 0}%</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Feed */}
            <Tabs defaultValue="feed" className="animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="feed">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Feed
                  </TabsTrigger>
                  <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                  <TabsTrigger value="collaborations">
                    <Users className="h-4 w-4 mr-2" />
                    Collaborations
                  </TabsTrigger>
                </TabsList>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gradient-primary shadow-glow">
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowFindProjectsDialog(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Find Projects to Collaborate On
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <TabsContent value="feed" className="space-y-4">
                {projects.length === 0 ? (
                  <Card className="glass-card shadow-card p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Be the first to post a collaboration opportunity!
                    </p>
                  </Card>
                ) : (
                  projects.map((project) => (
                    <CollaborationCard
                      key={project.id}
                      id={project.id}
                      title={project.title}
                      author={project.profiles?.full_name || "Unknown User"}
                      avatar={project.profiles?.avatar_url || ""}
                      description={project.description}
                      skills={project.required_skills || []}
                      timePosted={getTimeAgo(project.created_at)}
                      onRequestCollaboration={() => handleRequestCollaboration(project.id)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="my-projects">
                {myProjects.length === 0 ? (
                  <Card className="glass-card shadow-card p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start collaborating by creating your first project
                    </p>
                    <Button 
                      className="gradient-primary"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Create Project
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myProjects.map((project) => (
                      project.collaborator_id ? (
                        <ProjectCollaborationCard
                          key={project.id}
                          project={project}
                          creatorProfile={profilesMap.get(project.user_id)}
                          collaboratorProfile={profilesMap.get(project.collaborator_id)}
                          onUpdate={loadData}
                        />
                      ) : (
                        <Card key={project.id} className="glass-card shadow-card p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{project.title}</h3>
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
                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                              {project.validation_status !== 'approved' && (
                                <p className="text-xs text-destructive mt-2">
                                  Not counted — Invalid or irrelevant submission
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {project.required_skills?.map((skill: string) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                            <Badge variant="outline">{project.status}</Badge>
                          </div>
                        </Card>
                      )
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="collaborations">
                {collaborativeProjects.length === 0 ? (
                  <Card className="glass-card shadow-card p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active collaborations</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Find projects to collaborate on or wait for requests on your projects
                    </p>
                    <Button 
                      className="gradient-primary"
                      onClick={() => setShowFindProjectsDialog(true)}
                    >
                      Find Projects
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {collaborativeProjects.map((project) => (
                      <ProjectCollaborationCard
                        key={project.id}
                        project={project}
                        creatorProfile={profilesMap.get(project.user_id)}
                        collaboratorProfile={profilesMap.get(project.collaborator_id)}
                        onUpdate={loadData}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card shadow-card p-6 animate-scale-in">
              <Link to={`/profile/${user?.id}`}>
                <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.grade || "Student"}</p>
                  </div>
                </div>
              </Link>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/profile/${user?.id}`}>
                  View Profile
                </Link>
              </Button>
            </Card>

            <PortfolioGapScanner
              profile={profile}
              projects={myProjects}
              achievements={achievements}
              collaborativeProjects={collaborativeProjects}
            />

            <Card className="glass-card shadow-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={`/profile/${user?.id}`}>
                    <Users className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CreateProjectDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleProjectCreated}
        userMajor={profile?.major}
      />
      
      <FindProjectsDialog
        open={showFindProjectsDialog}
        onOpenChange={setShowFindProjectsDialog}
      />
    </div>
  );
};

export default Dashboard;
