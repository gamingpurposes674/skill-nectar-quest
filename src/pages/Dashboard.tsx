import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  Plus, 
  Users, 
  Target,
  TrendingUp,
  Sparkles,
  BookOpen,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CollaborationCard from "@/components/CollaborationCard";
import CreateProjectDialog from "@/components/CreateProjectDialog";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

      // Load all projects (feed)
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10);

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load user's own projects
      const { data: myProjectsData, error: myProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (myProjectsError) throw myProjectsError;
      setMyProjects(myProjectsData || []);

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
            <h1 className="text-xl font-bold text-gradient cursor-pointer">ConnectEd</h1>
          </Link>
          
          <div className="flex items-center gap-4">
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
                    <p className="text-2xl font-bold">0</p>
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
                </TabsList>
                
                <Button 
                  className="gradient-primary shadow-glow"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
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
                      onRequestCollaboration={() => {
                        toast.success("Collaboration request sent!");
                      }}
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
                      <Card key={project.id} className="glass-card shadow-card p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {project.required_skills?.map((skill: string) => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <Badge>{project.status}</Badge>
                        </div>
                      </Card>
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
      />
    </div>
  );
};

export default Dashboard;
