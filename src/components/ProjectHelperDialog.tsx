import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, Sparkles, Users, User, ArrowRight, Bot } from "lucide-react";
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

const ASSISTANT_NAME = "Nova";

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
        content: "I had trouble generating suggestions. Describe what kind of project you're interested in, and I'll help you create something meaningful!",
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
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
        {/* Header with Nova branding */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                {ASSISTANT_NAME}
                <Sparkles className="h-4 w-4 text-primary" />
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Your AI project advisor · Powered by your profile & portfolio gaps
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {loading && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="relative mx-auto w-fit">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                        <Bot className="h-7 w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <Loader2 className="h-5 w-5 animate-spin text-primary absolute -bottom-1 -right-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">{ASSISTANT_NAME} is analyzing your profile...</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <Avatar className="h-7 w-7 flex-shrink-0 mt-1 ring-1 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-[10px]">
                      <Bot className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[85%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 border border-border/50"} rounded-2xl p-4`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-background/50 rounded-xl p-4 border border-border/60">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-foreground text-[13px]">{suggestion.title}</h4>
                            <Badge variant={suggestion.collaborative ? "default" : "secondary"} className="shrink-0 text-[10px]">
                              {suggestion.collaborative ? (
                                <><Users className="h-3 w-3 mr-1" /> Team</>
                              ) : (
                                <><User className="h-3 w-3 mr-1" /> Solo</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-1">{suggestion.problem}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.skills.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            <strong>Outcome:</strong> {suggestion.outcome}
                          </p>
                          <Button size="sm" className="mt-3 w-full h-8 text-xs" onClick={() => handleUseIdea(suggestion)}>
                            Use This Idea <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.project && (
                    <div className="mt-4 bg-background/50 rounded-xl p-4 border border-primary/40">
                      <h4 className="font-semibold text-foreground text-[13px]">{message.project.title}</h4>
                      <p className="text-[12px] text-muted-foreground mt-1">{message.project.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.project.skills?.map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                        ))}
                      </div>
                      <Button size="sm" className="mt-3 w-full h-8 text-xs" onClick={() => handleUseProject(message.project!)}>
                        Use This Project <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && messages.length > 0 && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-7 w-7 flex-shrink-0 mt-1 ring-1 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-[10px]">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/60 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-card/50">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${ASSISTANT_NAME} to refine, simplify, or plan...`}
              disabled={loading}
              className="flex-1 bg-muted/30 border-border/50"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="gradient-primary h-10 w-10">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Try: "Make this simpler" · "Add a step-by-step plan" · "Suggest collaborators"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectHelperDialog;
