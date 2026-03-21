import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Users, 
  Sparkles, 
  Target, 
  MessageSquare,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Build Your Portfolio",
      description: "Showcase your projects, skills, and achievements in a professional profile"
    },
    {
      icon: Sparkles,
      title: "Find Collaborators",
      description: "Connect with peers who share your interests and complement your skills"
    },
    {
      icon: Target,
      title: "Track Your Growth",
      description: "Monitor your portfolio health and get feedback from the community"
    },
    {
      icon: MessageSquare,
      title: "Get Mentorship",
      description: "Connect with college students and professionals for guidance"
    }
  ];


  return (
    <div className="min-h-screen relative">
      {/* Ambient glow */}
      <div className="glow-orb w-96 h-96 bg-primary/20 -top-48 left-1/4 fixed" />
      <div className="glow-orb w-72 h-72 bg-secondary/15 top-1/2 right-0 fixed" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gradient" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NexStep</span>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-primary shadow-glow btn-hover-lift">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in relative z-10">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Zap className="h-4 w-4 mr-2 inline" />
              Built for Students, by Students
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Your Professional
              <span className="block text-gradient">Network Starts Here</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect, collaborate, and grow with thousands of students. Build your portfolio, 
              find project partners, and get mentorship from college students and professionals.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary shadow-elegant text-lg px-8">
                  Start Building
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* CTA Tagline */}
            <div className="pt-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="glass-card rounded-2xl p-6 md:p-8 max-w-xl mx-auto text-center border border-border/40">
                <Sparkles className="h-6 w-6 text-accent mx-auto mb-3" />
                <p className="text-lg md:text-xl font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Be Part Of Something New
                </p>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  NexStep is growing — join early and shape the future of student collaboration.
                </p>
                <Link to="/auth">
                  <Button className="gradient-primary shadow-glow btn-hover-lift gap-2">
                    Join Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="h-4 w-4 mr-2 inline" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From portfolio building to mentorship, we've got all the tools to help you grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="glass-card shadow-card p-6 card-hover-glow group animate-scale-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="p-3 rounded-xl gradient-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 relative">
          <Card className="glass-card shadow-elegant p-12 max-w-4xl mx-auto text-center animate-scale-in card-hover-glow">
            <Award className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h2 className="text-4xl font-bold mb-4">Ready to Level Up?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already building their future. 
              Create your profile in minutes and start connecting today.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary shadow-glow text-lg px-12 btn-hover-lift">
                Create Your Profile
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 NexStep. Built for students, by students.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">About</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
