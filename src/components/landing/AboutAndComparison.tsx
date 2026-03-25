import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Heart, Info, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const comparisonData = [
  { feature: "Real-time collaboration", nexstep: true, professional: false, counseling: false, community: "warn" },
  { feature: "Peer mentorship", nexstep: true, professional: false, counseling: "warn", community: "warn" },
  { feature: "Skill verification", nexstep: true, professional: "warn", counseling: false, community: false },
  { feature: "Portfolio health tracking", nexstep: true, professional: false, counseling: false, community: false },
  { feature: "Built for school students", nexstep: true, professional: false, counseling: "warn", community: false },
  { feature: "Free to use", nexstep: true, professional: false, counseling: "warn", community: true },
];

const StatusIcon = ({ value }: { value: boolean | string }) => {
  if (value === true) return <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />;
  if (value === "warn") return <AlertTriangle className="h-5 w-5 text-yellow-400 mx-auto" />;
  return <XCircle className="h-5 w-5 text-red-400 mx-auto" />;
};

const AboutAndComparison = () => {
  return (
    <>
      {/* About NexStep */}
      <section className="py-28 section-alt-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <Badge variant="secondary" className="mb-4">
              <Info className="h-4 w-4 mr-2 inline" />
              About NexStep
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">Why NexStep?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              NexStep was built by a student, for students. Born out of the overwhelm of college prep
              and the need for a space where students could actually build things together — not just
              list achievements. We believe in collaboration over competition, and in portfolios that
              are earned, not curated.
            </p>
          </div>
        </div>
      </section>

      {/* NexStep vs The Rest */}
      <section className="py-28 section-alt-a">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <Badge variant="secondary" className="mb-4">
              <CheckCircle2 className="h-4 w-4 mr-2 inline" />
              Compare
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">NexStep vs The Rest</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how NexStep stacks up against other platforms
            </p>
          </div>

          <Card className="border border-border/50 bg-card max-w-4xl mx-auto overflow-hidden animate-scale-in">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-foreground font-semibold">Feature</TableHead>
                  <TableHead className="text-center text-primary font-bold">NexStep</TableHead>
                  <TableHead className="text-center text-muted-foreground">Professional Networks</TableHead>
                  <TableHead className="text-center text-muted-foreground">Counseling Platforms</TableHead>
                  <TableHead className="text-center text-muted-foreground">Community Spaces</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((row) => (
                  <TableRow key={row.feature} className="border-border/30">
                    <TableCell className="font-medium text-foreground">{row.feature}</TableCell>
                    <TableCell><StatusIcon value={row.nexstep} /></TableCell>
                    <TableCell><StatusIcon value={row.professional} /></TableCell>
                    <TableCell><StatusIcon value={row.counseling} /></TableCell>
                    <TableCell><StatusIcon value={row.community} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Created By */}
          <div className="max-w-2xl mx-auto mt-16 text-center space-y-5 animate-fade-in">
            <p className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Created by{" "}
              <span className="text-primary">Amaira Varshney</span>
              <span className="text-muted-foreground">, Grade XII</span>
            </p>
            <p className="text-sm text-muted-foreground italic leading-relaxed max-w-xl mx-auto">
              "As a senior in Grade XII and someone who is still stressing about my portfolio, I
              completely understand what others my age must be feeling. A platform like NexStep is
              what I needed, but it was nowhere to be found — so with the help of the right tools
              and a lot of determination, NexStep was created. I hope it grows into an incredible
              collaborative platform that helps millions of students worldwide."
            </p>
            <Heart className="h-5 w-5 text-primary mx-auto opacity-60" />
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutAndComparison;
