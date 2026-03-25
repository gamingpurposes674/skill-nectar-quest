import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, Heart, MessageSquare, Share2 } from "lucide-react";

const DemoCards = () => (
  <section className="py-28 section-alt-b">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">Preview</Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          What You'll Build
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Here's a sneak peek at what your profile and projects look like on NexStep
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Demo Profile Card */}
        <Card className="border border-border/50 bg-card p-6">
          <div className="flex items-start gap-4 mb-5">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                AS
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">Aanya Sharma</h3>
              <p className="text-sm text-muted-foreground">11th Grade · Delhi Public School</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>New Delhi, India</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Aspiring computer scientist passionate about AI and sustainability. Looking to collaborate on impactful projects.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {["Python", "Machine Learning", "UI/UX", "Research"].map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
          <div className="border-t border-border/40 pt-4">
            <p className="text-xs text-muted-foreground mb-1">Featured Project</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-accent" />
              Eco-Track: Carbon Footprint Calculator
            </p>
          </div>
        </Card>

        {/* Demo Project Card */}
        <Card className="border border-border/50 bg-card p-6">
          <Badge variant="default" className="mb-3 text-xs">Open For Collaboration</Badge>
          <h3 className="text-lg font-semibold mb-2">Study Buddy — AI Homework Helper</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Building an AI-powered study assistant that helps students break down complex topics into bite-sized explanations. Looking for a frontend developer and a designer.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {["React", "OpenAI API", "Figma", "TypeScript"].map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
          <div className="border-t border-border/40 pt-4 flex items-center gap-5 text-muted-foreground">
            <span className="flex items-center gap-1.5 text-sm">
              <Heart className="h-4 w-4" /> 24
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <MessageSquare className="h-4 w-4" /> 8
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Share2 className="h-4 w-4" /> 3
            </span>
          </div>
        </Card>
      </div>
    </div>
  </section>
);

export default DemoCards;
