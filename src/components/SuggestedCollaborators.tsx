import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Puzzle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import ConnectionButton from "@/components/ConnectionButton";

// Complementary skill mapping — each skill maps to skills that pair well with it
const COMPLEMENTARY_MAP: Record<string, string[]> = {
  "Python": ["UI/UX Design", "Marketing", "Business Strategy", "Graphic Design", "Public Speaking"],
  "JavaScript": ["Python", "UI/UX Design", "Business Strategy", "Data Analysis"],
  "React": ["Python", "Data Analysis", "Machine Learning", "Business Strategy"],
  "Java": ["UI/UX Design", "Graphic Design", "Marketing", "Data Analysis"],
  "C++": ["UI/UX Design", "Research", "Data Analysis", "3D Modeling"],
  "Node.js": ["UI/UX Design", "Graphic Design", "Marketing", "Data Analysis"],
  "HTML": ["Python", "Data Analysis", "Machine Learning", "Business Strategy"],
  "CSS": ["Python", "JavaScript", "Data Analysis", "Business Strategy"],
  "Machine Learning": ["UI/UX Design", "Business Strategy", "Marketing", "Public Speaking"],
  "Data Analysis": ["UI/UX Design", "Graphic Design", "Creative Writing", "Marketing"],
  "UI/UX Design": ["Python", "JavaScript", "React", "Data Analysis", "Machine Learning"],
  "Graphic Design": ["Python", "JavaScript", "Data Analysis", "Marketing", "Business Strategy"],
  "Video Editing": ["Python", "Marketing", "Creative Writing", "Public Speaking"],
  "3D Modeling": ["Python", "JavaScript", "Marketing", "Data Analysis"],
  "Creative Writing": ["Data Analysis", "Python", "Graphic Design", "Marketing"],
  "Photography": ["Python", "Graphic Design", "Video Editing", "Marketing"],
  "Public Speaking": ["Python", "Data Analysis", "UI/UX Design", "Research"],
  "Business Strategy": ["Python", "JavaScript", "React", "Data Analysis", "UI/UX Design"],
  "Marketing": ["Python", "JavaScript", "Data Analysis", "UI/UX Design"],
  "Research": ["UI/UX Design", "Python", "Marketing", "Creative Writing"],
};

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

      // Build set of complementary skills for current user
      const mySkills = currentUserSkills || [];
      const wantedSkills = new Set<string>();
      mySkills.forEach((s) => {
        const complements = COMPLEMENTARY_MAP[s] || [];
        complements.forEach((c) => wantedSkills.add(c));
      });
      // Remove skills the user already has
      mySkills.forEach((s) => wantedSkills.delete(s));

      // Score by how many complementary skills each profile has
      const scored = profiles
        .map((p) => {
          const theirSkills = p.skills || [];
          const overlap = theirSkills.filter((s: string) => wantedSkills.has(s)).length;
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
        <Puzzle className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          Find Your Missing Piece
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/25 truncate max-w-[120px]">
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
