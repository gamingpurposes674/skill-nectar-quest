import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rohan Mehta",
    detail: "12th Grade · Mumbai",
    initials: "RM",
    quote:
      "I had project ideas but no one to work with. NexStep matched me with a designer and a coder in my city — we built a full app in three weeks and submitted it to a national hackathon.",
  },
  {
    name: "Priya Nair",
    detail: "10th Grade · Bangalore",
    initials: "PN",
    quote:
      "My portfolio was basically empty before NexStep. Now I have three collaborative projects, a mentor from IIT, and way more confidence talking about my work in college interviews.",
  },
  {
    name: "Arjun Patel",
    detail: "11th Grade · Ahmedabad",
    initials: "AP",
    quote:
      "The mentorship feature is a game-changer. I connected with a college senior who helped me scope my research project and gave feedback every week. I couldn't have done it alone.",
  },
];

const Testimonials = () => (
  <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">Testimonials</Badge>
        <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          What Students Say
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Real stories from students who leveled up with NexStep
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {testimonials.map((t, idx) => (
          <Card
            key={idx}
            className="glass-card shadow-card p-6 card-hover-glow flex flex-col"
          >
            <Quote className="h-8 w-8 text-primary/40 mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">
              "{t.quote}"
            </p>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/40">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-bold">
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
