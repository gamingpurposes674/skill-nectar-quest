import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, Users, User, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectSuggestion {
  title: string;
  problem: string;
  skills: string[];
  collaborative: boolean;
  outcome: string;
  size: string;
  proofSuggestion: string;
}

interface ProjectData {
  title: string;
  description: string;
  skills: string[];
  size: string;
  proofSuggestion?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: ProjectSuggestion[];
  project?: ProjectData;
}

interface UserProfile {
  grade: string | null;
  major: string | null;
  skills: string[];
  existingProjects: number;
  existingProjectTypes: string[];
  portfolioGaps: string[];
  hasResearch: boolean;
  hasCollaborative: boolean;
  hasLongTerm: boolean;
}

interface ProjectHelperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  onUseIdea: (project: { title: string; description: string; skills: string[]; size: string }) => void;
}

const ProjectHelperDialog = ({ open, onOpenChange, userProfile, onUseIdea }: ProjectHelperDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !initialized) {
      generateInitialSuggestions();
      setInitialized(true);
    }
  }, [open, initialized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  interface ParsedResponse {
    type: string;
    message: string;
    projects?: ProjectSuggestion[];
    title?: string;
    description?: string;
    skills?: string[];
    size?: string;
    proofSuggestion?: string;
  }

  const parseAIResponse = (content: string): ParsedResponse => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }
    return { type: "chat", message: content };
  };

  const generateInitialSuggestions = async () => {
    setLoading(true);
    try {
      const initialMessage = `Based on my profile, suggest 3-5 project ideas that would strengthen my college portfolio. Focus on filling my gaps and matching my grade level.`;
      
      const { data, error } = await supabase.functions.invoke("project-helper", {
        body: {
          messages: [{ role: "user", content: initialMessage }],
          userProfile,
        },
      });

      if (error) throw error;

      const parsed = parseAIResponse(data.content);
      
      setMessages([{
        role: "assistant",
        content: parsed.message || "Here are some project ideas tailored for you:",
        suggestions: parsed.projects,
      }]);
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate suggestions. Please try again.");
      setMessages([{
        role: "assistant",
        content: "I had trouble generating suggestions. Please describe what kind of project you're interested in, and I'll help you create something meaningful.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const allMessages = [
        ...messages.map(m => ({
          role: m.role,
          content: m.content + (m.suggestions ? `\n\nSuggested projects: ${JSON.stringify(m.suggestions)}` : ""),
        })),
        { role: "user", content: userMessage },
      ];

      const { data, error } = await supabase.functions.invoke("project-helper", {
        body: {
          messages: allMessages,
          userProfile,
        },
      });

      if (error) throw error;

      const parsed = parseAIResponse(data.content);
      
      const projectData: ProjectData | undefined = parsed.type === "project" && parsed.title && parsed.description && parsed.skills && parsed.size
        ? { title: parsed.title, description: parsed.description, skills: parsed.skills, size: parsed.size, proofSuggestion: parsed.proofSuggestion }
        : undefined;

      setMessages(prev => [...prev, {
        role: "assistant" as const,
        content: parsed.message,
        suggestions: parsed.type === "suggestions" ? parsed.projects : undefined,
        project: projectData,
      }]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseIdea = (suggestion: ProjectSuggestion) => {
    onUseIdea({
      title: suggestion.title,
      description: `${suggestion.problem}\n\nExpected Outcome: ${suggestion.outcome}\n\nSuggested Proof: ${suggestion.proofSuggestion}`,
      skills: suggestion.skills,
      size: suggestion.size,
    });
    onOpenChange(false);
    toast.success("Project idea loaded! Review and customize before submitting.");
  };

  const handleUseProject = (project: { title: string; description: string; skills: string[]; size: string }) => {
    onUseIdea(project);
    onOpenChange(false);
    toast.success("Project loaded! Review and customize before submitting.");
  };

  const handleClose = () => {
    setMessages([]);
    setInitialized(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Project Helper
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions based on your profile and portfolio gaps
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {loading && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing your profile...</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-4`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-background/50 rounded-lg p-4 border border-border">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                            <Badge variant={suggestion.collaborative ? "default" : "secondary"} className="shrink-0">
                              {suggestion.collaborative ? (
                                <><Users className="h-3 w-3 mr-1" /> Team</>
                              ) : (
                                <><User className="h-3 w-3 mr-1" /> Solo</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.problem}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.skills.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong>Outcome:</strong> {suggestion.outcome}
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => handleUseIdea(suggestion)}
                          >
                            Use This Idea <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.project && (
                    <div className="mt-4 bg-background/50 rounded-lg p-4 border border-primary">
                      <h4 className="font-semibold text-foreground">{message.project.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{message.project.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.project.skills?.map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleUseProject(message.project!)}
                      >
                        Use This Project <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to refine, simplify, or get a roadmap..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Try: "Make this simpler" • "Add a step-by-step plan" • "Suggest collaborators"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectHelperDialog;
