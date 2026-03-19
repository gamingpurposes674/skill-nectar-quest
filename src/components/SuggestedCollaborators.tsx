import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import ConnectionButton from "@/components/ConnectionButton";

interface SuggestedProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  grade: string | null;
  skills: string[] | null;
}

interface SuggestedCollaboratorsProps {
  currentUserId: string;
  currentUserSkills: string[] | null;
}

const SuggestedCollaborators = ({
  currentUserId,
  currentUserSkills,
}: SuggestedCollaboratorsProps) => {
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    loadSuggestions();
  }, [currentUserId, currentUserSkills]);

  const loadSuggestions = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, grade, skills")
        .neq("id", currentUserId)
        .limit(50);

      if (error) throw error;
      if (!profiles) return;

      const mySkills = new Set(currentUserSkills || []);

      // Score by overlapping skills, take top 4
      const scored = profiles
        .map((p) => {
          const overlap = (p.skills || []).filter((s: string) => mySkills.has(s)).length;
          return { ...p, score: overlap };
        })
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      setSuggestions(scored);
    } catch (err) {
      console.error("Error loading suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          Suggested Collaborators
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
          >
            <div className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_hsl(var(--accent)/0.15)]">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${profile.id}`}>
                  <Avatar className="h-10 w-10 ring-2 ring-border hover:ring-accent/30 transition-all">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback className="text-xs">
                      {profile.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${profile.id}`}
                    className="text-[13px] font-semibold text-foreground hover:text-accent transition-colors truncate block"
                  >
                    {profile.full_name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {profile.grade || "Student"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 gap-2">
                {(profile.skills || []).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/60 truncate max-w-[120px]">
                    {profile.skills![0]}
                  </span>
                )}
                <div className="ml-auto">
                  <ConnectionButton
                    currentUserId={currentUserId}
                    targetUserId={profile.id}
                    targetUserName={profile.full_name}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedCollaborators;
