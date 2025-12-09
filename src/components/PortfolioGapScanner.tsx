import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Target,
  Loader2 
} from "lucide-react";

interface PortfolioGapScannerProps {
  profile: {
    grade?: string;
    major?: string;
    skills?: string[];
  } | null;
  projects: any[];
  achievements: any[];
  collaborativeProjects: any[];
}

// Major-specific competency requirements
const MAJOR_COMPETENCIES: Record<string, string[]> = {
  "Computer Science": ["coding projects", "apps", "websites", "algorithms", "research", "hackathons", "software development"],
  "Business Administration": ["leadership", "entrepreneurship", "finance projects", "case studies", "competitions", "marketing"],
  "Biology": ["lab work", "research papers", "experiments", "science fairs", "data analysis", "environmental studies"],
  "Art & Design": ["portfolios", "illustrations", "design projects", "digital media", "creative work", "visual arts"],
  "Engineering": ["technical projects", "prototypes", "CAD designs", "robotics", "innovation", "problem-solving"],
  "Psychology": ["research studies", "data analysis", "case studies", "behavioral experiments", "surveys"],
  "Economics": ["financial analysis", "market research", "data modeling", "economic studies", "forecasting"],
  "Mathematics": ["mathematical modeling", "data analysis", "algorithms", "proofs", "computational projects"],
  "Physics": ["lab experiments", "research", "simulations", "data analysis", "theoretical work"],
  "Chemistry": ["lab work", "experiments", "research", "chemical analysis", "synthesis projects"],
  "English": ["writing samples", "literary analysis", "creative writing", "publications", "editing"],
  "History": ["research papers", "historical analysis", "archival work", "documentation", "presentations"],
  "Political Science": ["policy analysis", "research", "debate", "government studies", "civic engagement"],
  "Sociology": ["social research", "surveys", "community projects", "data analysis", "field studies"],
  "Environmental Science": ["field research", "sustainability projects", "data collection", "conservation work"],
  "Communications": ["media projects", "public speaking", "journalism", "content creation", "broadcasting"],
  "Marketing": ["campaigns", "market research", "branding projects", "social media", "analytics"],
  "Finance": ["financial modeling", "investment analysis", "accounting projects", "budgeting"],
  "Pre-Med": ["clinical experience", "research", "lab work", "volunteer work", "shadowing"],
  "Pre-Law": ["mock trial", "debate", "legal research", "policy analysis", "writing samples"],
};

// Skill alignment by major
const MAJOR_SKILLS: Record<string, string[]> = {
  "Computer Science": ["Python", "Java", "C++", "JavaScript", "React", "Node.js", "Machine Learning", "Data Analysis", "HTML", "CSS"],
  "Business Administration": ["Business Strategy", "Marketing", "Public Speaking", "Data Analysis"],
  "Biology": ["Research", "Data Analysis", "Lab Skills"],
  "Art & Design": ["UI/UX Design", "Graphic Design", "3D Modeling", "Creative Writing", "Photography", "Video Editing"],
  "Engineering": ["Python", "C++", "3D Modeling", "Data Analysis", "Machine Learning"],
  "Psychology": ["Research", "Data Analysis", "Public Speaking"],
  "Economics": ["Data Analysis", "Python", "Business Strategy"],
  "Mathematics": ["Python", "Data Analysis", "Machine Learning"],
  "Physics": ["Python", "Data Analysis", "Research"],
  "Chemistry": ["Research", "Data Analysis", "Lab Skills"],
  "English": ["Creative Writing", "Research", "Public Speaking"],
  "History": ["Research", "Creative Writing", "Public Speaking"],
  "Political Science": ["Research", "Public Speaking", "Business Strategy"],
  "Sociology": ["Research", "Data Analysis", "Public Speaking"],
  "Environmental Science": ["Research", "Data Analysis", "Python"],
  "Communications": ["Public Speaking", "Creative Writing", "Video Editing", "Marketing"],
  "Marketing": ["Marketing", "Business Strategy", "Graphic Design", "Data Analysis"],
  "Finance": ["Data Analysis", "Python", "Business Strategy"],
  "Pre-Med": ["Research", "Data Analysis"],
  "Pre-Law": ["Research", "Public Speaking", "Creative Writing"],
};

interface ScanResults {
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

const PortfolioGapScanner = ({ 
  profile, 
  projects, 
  achievements,
  collaborativeProjects 
}: PortfolioGapScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);

  const analyzePortfolio = () => {
    setIsScanning(true);
    setResults(null);

    // Simulate analysis time for UX
    setTimeout(() => {
      const strengths: string[] = [];
      const gaps: string[] = [];
      const suggestions: string[] = [];

      const validProjects = projects.filter(p => p.validation_status === 'approved');
      const major = profile?.major || "";
      const grade = profile?.grade || "";
      const userSkills = profile?.skills || [];

      // 1. Core Experience for Major Analysis
      const majorCompetencies = MAJOR_COMPETENCIES[major] || [];
      const hasRelevantExperience = validProjects.some(p => {
        const desc = (p.description || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        return majorCompetencies.some(comp => 
          desc.includes(comp.toLowerCase()) || title.includes(comp.toLowerCase())
        );
      });

      if (hasRelevantExperience) {
        strengths.push(`Projects aligned with ${major || "your major"} field`);
      } else if (major) {
        gaps.push(`No projects directly related to ${major} core competencies`);
        suggestions.push(`Add a project showcasing ${majorCompetencies.slice(0, 2).join(" or ")} for your ${major} major`);
      }

      // 2. Depth of Projects Analysis
      const projectsWithProof = validProjects.filter(p => p.proof_file_url);
      const longTermProjects = validProjects.filter(p => p.project_size === 'major');
      const collaborativeCount = collaborativeProjects.filter(p => p.is_complete).length;

      if (projectsWithProof.length > 0) {
        strengths.push(`${projectsWithProof.length} project(s) with verified proof of work`);
      } else if (validProjects.length > 0) {
        gaps.push("Projects lack proof-of-work documentation");
        suggestions.push("Upload proof files (images/documents) to strengthen project credibility");
      }

      if (longTermProjects.length > 0) {
        strengths.push(`${longTermProjects.length} major/long-term project(s) showing commitment`);
      } else if (validProjects.length > 0) {
        gaps.push("No major projects demonstrating long-term effort");
        suggestions.push("Complete at least one major project to show sustained commitment");
      }

      if (collaborativeCount > 0) {
        strengths.push(`${collaborativeCount} completed collaborative project(s)`);
      } else {
        gaps.push("No completed collaborative projects");
        suggestions.push("Join or create a collaborative project to demonstrate teamwork skills");
      }

      // 3. Recommended College-Ready Structure
      const hasResearchProject = validProjects.some(p => {
        const desc = (p.description || "").toLowerCase();
        return desc.includes("research") || desc.includes("study") || desc.includes("analysis");
      });

      const hasCollaborativeProject = collaborativeProjects.length > 0;
      const hasLongTermProject = longTermProjects.length > 0;
      const hasEnoughProjects = validProjects.length >= 3;
      const validAchievements = achievements.filter(a => a.validation_status === 'approved');
      const hasFieldAchievement = validAchievements.length > 0;

      const majorSkills = MAJOR_SKILLS[major] || [];
      const alignedSkills = userSkills.filter((s: string) => 
        majorSkills.some(ms => ms.toLowerCase() === s.toLowerCase())
      );
      const hasEnoughMajorSkills = alignedSkills.length >= 2;

      if (hasResearchProject) {
        strengths.push("Research-based project present");
      } else {
        gaps.push("No research-based project");
        suggestions.push("Add a project involving research, data collection, or analysis");
      }

      if (hasCollaborativeProject) {
        strengths.push("Collaborative experience demonstrated");
      }

      if (hasLongTermProject) {
        strengths.push("Long-term commitment demonstrated");
      }

      if (hasEnoughProjects) {
        strengths.push(`${validProjects.length} validated projects in portfolio`);
      } else {
        gaps.push(`Only ${validProjects.length} of 3 minimum projects`);
        const gradeLevel = getGradeLevel(grade);
        if (gradeLevel === "junior") {
          suggestions.push("Start with small, achievable projects in your area of interest");
        } else {
          suggestions.push("Add more projects to reach the recommended minimum of 3");
        }
      }

      if (hasFieldAchievement) {
        strengths.push(`${validAchievements.length} verified achievement(s)`);
      } else {
        gaps.push("No verified achievements");
        suggestions.push("Add achievements like awards, certifications, or competition placements");
      }

      if (hasEnoughMajorSkills) {
        strengths.push(`${alignedSkills.length} skills aligned with ${major || "your major"}`);
      } else if (major) {
        gaps.push(`Only ${alignedSkills.length} of 2 minimum major-aligned skills`);
        const suggestedSkills = majorSkills.filter(s => !alignedSkills.includes(s)).slice(0, 2);
        if (suggestedSkills.length > 0) {
          suggestions.push(`Develop skills in: ${suggestedSkills.join(", ")}`);
        }
      }

      // 4. Skill Alignment Check
      const projectSkills = validProjects.flatMap(p => p.required_skills || []);
      const uniqueProjectSkills = [...new Set(projectSkills)];
      const alignedProjectSkills = uniqueProjectSkills.filter((s: string) =>
        majorSkills.some(ms => ms.toLowerCase() === s.toLowerCase())
      );

      if (alignedProjectSkills.length > 0 && major) {
        strengths.push(`Project skills match ${major} requirements`);
      } else if (uniqueProjectSkills.length > 0 && major) {
        gaps.push("Project skills don't align well with your major");
        suggestions.push("Focus future projects on skills relevant to your major");
      }

      // Grade-specific suggestions
      const gradeLevel = getGradeLevel(grade);
      if (gradeLevel === "junior" && gaps.length > 3) {
        suggestions.push("Focus on 1-2 areas first rather than trying to fill all gaps at once");
      } else if (gradeLevel === "senior" && gaps.length > 0) {
        suggestions.push("Prioritize completing major projects and gaining collaborative experience");
      }

      // Ensure we have content in each section
      if (strengths.length === 0) {
        strengths.push("Starting your portfolio journey - great first step!");
      }

      setResults({ strengths, gaps, suggestions });
      setIsScanning(false);
    }, 1500);
  };

  const getGradeLevel = (grade: string): "junior" | "mid" | "senior" => {
    const gradeNum = parseInt(grade);
    if (!isNaN(gradeNum)) {
      if (gradeNum <= 8) return "junior";
      if (gradeNum <= 10) return "mid";
      return "senior";
    }
    if (grade?.toLowerCase().includes("college") || grade?.toLowerCase().includes("university")) {
      return "senior";
    }
    return "mid";
  };

  const handleScan = () => {
    setIsOpen(true);
    analyzePortfolio();
  };

  return (
    <>
      <Card className="glass-card shadow-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Portfolio Gap Scanner</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          See how your portfolio compares to expectations for your selected major.
        </p>
        <Button 
          className="w-full gradient-primary shadow-glow"
          onClick={handleScan}
        >
          <Target className="h-4 w-4 mr-2" />
          Scan My Portfolio
        </Button>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Portfolio Gap Analysis
            </DialogTitle>
          </DialogHeader>

          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Analyzing your portfolio...</p>
            </div>
          ) : results ? (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Strengths Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold text-lg">Strengths</h4>
                  </div>
                  <div className="space-y-2 pl-7">
                    {results.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✓
                        </Badge>
                        <p className="text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps Section */}
                {results.gaps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <h4 className="font-semibold text-lg">Missing Components</h4>
                    </div>
                    <div className="space-y-2 pl-7">
                      {results.gaps.map((gap, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            ⚠
                          </Badge>
                          <p className="text-sm">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions Section */}
                {results.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-lg">Specific Suggestions to Improve</h4>
                    </div>
                    <div className="space-y-2 pl-7">
                      {results.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            🎯
                          </Badge>
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <Card className="p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>Summary:</strong> Your portfolio has {results.strengths.length} strength(s) 
                    {results.gaps.length > 0 && ` and ${results.gaps.length} area(s) for improvement`}. 
                    Focus on the suggestions above to strengthen your college application.
                  </p>
                </Card>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortfolioGapScanner;
