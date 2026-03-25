import { Badge } from "@/components/ui/badge";
import { UserPlus, FolderPlus, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Set up your student profile with your skills, interests, and goals in minutes",
  },
  {
    icon: FolderPlus,
    title: "Post Or Join A Project",
    description: "Share your own project idea or browse and join one that excites you",
  },
  {
    icon: Rocket,
    title: "Collaborate And Grow",
    description: "Work with peers, track milestones, and build a portfolio that stands out",
  },
];

const HowItWorks = () => (
  <section className="py-28 section-alt-a">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">How It Works</Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Three Simple Steps
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Getting started on NexStep takes less than five minutes
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col items-center text-center">
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
            )}
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <step.icon className="h-9 w-9 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
              Step {idx + 1}
            </span>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
