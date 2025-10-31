import { useState } from "react";
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
  ThumbsUp,
  MessageSquare,
  Lightbulb,
  Flame
} from "lucide-react";
import PortfolioHealthIndicator from "@/components/PortfolioHealthIndicator";
import FeedbackPanel from "@/components/FeedbackPanel";

const Profile = () => {
  const [reactions, setReactions] = useState({
    thumbsUp: 24,
    flame: 15,
    lightbulb: 8,
    message: 12
  });

  // Mock profile data
  const profile = {
    name: "Alex Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    school: "Central High School",
    grade: "Grade 10",
    location: "San Francisco, CA",
    bio: "Passionate about web development and AI. Building projects that make a difference. Always eager to learn and collaborate!",
    skills: ["React", "Python", "UI/UX Design", "Machine Learning", "JavaScript"],
    achievements: [
      "1st Place - Regional Science Fair 2024",
      "Google Code-in Finalist",
      "Published Research Paper on AI Ethics"
    ],
    projects: [
      { title: "AI Homework Helper", description: "ML-powered study assistant", link: "#" },
      { title: "EcoTracker App", description: "Carbon footprint calculator", link: "#" }
    ],
    portfolioHealth: 85
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient">ConnectEd</h1>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm">Dashboard</Button>
            <Button variant="default" size="sm">Edit Profile</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card shadow-elegant p-6 animate-fade-in">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback>AJ</AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <GraduationCap className="h-4 w-4" />
                    {profile.grade}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-foreground/80">
                  {profile.bio}
                </p>

                <div className="flex gap-2 w-full">
                  <Button className="flex-1" variant="default">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button className="flex-1" variant="outline">
                    Connect
                  </Button>
                </div>

                <div className="flex gap-3 pt-2">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </Card>

            <PortfolioHealthIndicator score={profile.portfolioHealth} />
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
                <Card className="glass-card shadow-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Skills & Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <Card className="glass-card shadow-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Education</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{profile.school}</p>
                    <p className="text-sm text-muted-foreground">{profile.grade}</p>
                    <p className="text-sm text-muted-foreground">{profile.location}</p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-4 mt-6">
                {profile.projects.map((project, idx) => (
                  <Card key={idx} className="glass-card shadow-card p-6 hover:shadow-elegant transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{project.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4 mt-6">
                <Card className="glass-card shadow-card p-6">
                  <ul className="space-y-3">
                    {profile.achievements.map((achievement, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </TabsContent>
            </Tabs>

            <FeedbackPanel reactions={reactions} onReact={(type) => {
              setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
