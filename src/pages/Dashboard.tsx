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
  MessageSquare, 
  TrendingUp,
  Sparkles,
  BookOpen,
  Target
} from "lucide-react";
import CollaborationCard from "@/components/CollaborationCard";

const Dashboard = () => {
  const projects = [
    {
      id: 1,
      title: "Mobile App for Mental Health",
      author: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      description: "Looking for a UI/UX designer and React Native developer to build a mental wellness app for teens.",
      skills: ["React Native", "UI/UX", "Firebase"],
      timePosted: "2 hours ago"
    },
    {
      id: 2,
      title: "Climate Change Data Visualization",
      author: "Marcus Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      description: "Need data scientists and frontend developers for an interactive climate data dashboard project.",
      skills: ["Python", "D3.js", "Data Analysis"],
      timePosted: "5 hours ago"
    },
    {
      id: 3,
      title: "Educational Game Development",
      author: "Priya Patel",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
      description: "Creating an educational game to teach coding to elementary students. Need game designers and developers!",
      skills: ["Unity", "C#", "Game Design"],
      timePosted: "1 day ago"
    }
  ];

  const mentors = [
    { name: "Dr. Emily Watson", specialty: "Computer Science", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" },
    { name: "James Liu", specialty: "Product Design", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James" },
    { name: "Sofia Rodriguez", specialty: "Data Science", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient">ConnectEd</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects, people..."
                className="pl-10 pr-4 py-2 rounded-full border border-border bg-card/50 focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
            </div>
            
            <Button size="icon" variant="ghost">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
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
                    <p className="text-2xl font-bold">127</p>
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
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
              </Card>
              
              <Card className="glass-card shadow-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                    <p className="text-2xl font-bold">89</p>
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
                  <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
                </TabsList>
                
                <Button className="gradient-primary shadow-glow">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              <TabsContent value="feed" className="space-y-4">
                {projects.map((project) => (
                  <CollaborationCard key={project.id} {...project} />
                ))}
              </TabsContent>

              <TabsContent value="my-projects">
                <Card className="glass-card shadow-card p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start collaborating by creating your first project
                  </p>
                  <Button className="gradient-primary">Create Project</Button>
                </Card>
              </TabsContent>

              <TabsContent value="mentorship">
                <div className="space-y-4">
                  {mentors.map((mentor, idx) => (
                    <Card key={idx} className="glass-card shadow-card p-6 hover:shadow-elegant transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={mentor.avatar} />
                            <AvatarFallback>{mentor.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{mentor.name}</p>
                            <p className="text-sm text-muted-foreground">{mentor.specialty}</p>
                          </div>
                        </div>
                        <Button variant="outline">Request Mentorship</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card shadow-card p-6 animate-scale-in">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">New collaboration request</p>
                    <p className="text-xs">2 hours ago</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass-card shadow-card p-6">
              <h3 className="font-semibold mb-4">Trending Skills</h3>
              <div className="flex flex-wrap gap-2">
                {["React", "Python", "UI/UX", "AI/ML", "Figma"].map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
