import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { toTitleCase } from "@/lib/textValidation";

interface TrendingProject {
  id: string;
  title: string;
  description: string;
  required_skills: string[] | null;
  created_at: string;
  user_id: string;
  proof_file_url: string | null;
  profiles?: { full_name: string; avatar_url: string | null } | null;
  reaction_count: number;
}

const TrendingProjects = () => {
  const [projects, setProjects] = useState<TrendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      // Get recent approved projects
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("validation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // Get reaction counts from feedback table
      const projectIds = projectsData.map((p) => p.id);
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("profile_id, reaction_type")
        .in("profile_id", projectIds);

      const reactionCounts = new Map<string, number>();
      (feedbackData || []).forEach((f) => {
        reactionCounts.set(f.profile_id, (reactionCounts.get(f.profile_id) || 0) + 1);
      });

      // Get profiles for projects
      const userIds = [...new Set(projectsData.map((p) => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.id, p])
      );

      // Sort by reaction count, take top 3
      const enriched = projectsData.map((p) => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null,
        reaction_count: reactionCounts.get(p.id) || 0,
      }));

      enriched.sort((a, b) => b.reaction_count - a.reaction_count);
      setProjects(enriched.slice(0, 3));
    } catch (err) {
      console.error("Error loading trending:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading || projects.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          Trending This Week
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className="w-full"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
          >
            <div className="rounded-xl border border-border/50 bg-card p-4 h-full transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_hsl(var(--accent)/0.15)]">
              <div className="flex items-center gap-2 mb-2.5">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={project.profiles?.avatar_url || ""} />
                  <AvatarFallback className="text-[10px]">
                    {project.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <Link
                  to={`/profile/${project.user_id}`}
                  className="text-[11px] text-accent hover:underline underline-offset-2 font-medium truncate"
                >
                  {project.profiles?.full_name || "Unknown"}
                </Link>
                <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {getTimeAgo(project.created_at)}
                </span>
              </div>

              <h3 className="text-[14px] font-bold text-foreground leading-snug mb-1.5 line-clamp-2 font-['Space_Grotesk',sans-serif]">
                {project.title}
              </h3>

              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                {project.description}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(project.required_skills || []).slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-muted/50 text-muted-foreground border border-border/60"
                  >
                    {skill}
                  </span>
                ))}
                {project.reaction_count > 0 && (
                  <span className="ml-auto text-[10px] text-accent font-medium">
                    🔥 {project.reaction_count}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrendingProjects;
