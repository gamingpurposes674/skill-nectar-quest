import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import TopNav from "@/components/TopNav";
import ConnectionButton from "@/components/ConnectionButton";

interface BrowseProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  grade: string | null;
  school: string | null;
  skills: string[] | null;
  bio: string | null;
}

const GRADE_OPTIONS = [
  "All Grades",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College Freshman",
  "College Sophomore",
  "College Junior",
  "College Senior",
  "Graduate",
];

const SKILL_OPTIONS = [
  "All Skills",
  "Python",
  "JavaScript",
  "React",
  "Java",
  "C++",
  "Machine Learning",
  "Data Analysis",
  "UI/UX Design",
  "Graphic Design",
  "Research",
  "Public Speaking",
  "Business Strategy",
  "Marketing",
];

const BrowseProfiles = () => {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [profiles, setProfiles] = useState<BrowseProfile[]>([]);
  const [filtered, setFiltered] = useState<BrowseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [skillFilter, setSkillFilter] = useState("All Skills");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [navProfile, setNavProfile] = useState<any>(null);

  useEffect(() => {
    loadProfiles();
    loadNavProfile();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [profiles, searchQuery, gradeFilter, skillFilter, schoolQuery]);

  const loadNavProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    setNavProfile(data);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, grade, school, skills, bio")
      .order("full_name");

    if (!error) setProfiles(data || []);
    setLoading(false);
  };

  const applyFilters = () => {
    let result = profiles.filter((p) => p.id !== user?.id);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (gradeFilter !== "All Grades") {
      result = result.filter((p) => p.grade === gradeFilter);
    }

    if (skillFilter !== "All Skills") {
      result = result.filter((p) => p.skills?.includes(skillFilter));
    }

    if (schoolQuery.trim()) {
      const sq = schoolQuery.toLowerCase();
      result = result.filter((p) => p.school?.toLowerCase().includes(sq));
    }

    setFiltered(result);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="glow-orb w-80 h-80 bg-primary/15 -top-40 -left-40 fixed" />
      <div className="glow-orb w-60 h-60 bg-secondary/10 top-1/3 -right-32 fixed" />

      <TopNav profile={navProfile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight font-['Space_Grotesk',sans-serif] text-foreground mb-1">
            Browse Profiles
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Discover students and find collaborators
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border/50 bg-card p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-[13px] bg-muted/30 border-border/50"
              />
            </div>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-9 rounded-md border border-border/50 bg-muted/30 px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="h-9 rounded-md border border-border/50 bg-muted/30 px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SKILL_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Input
              placeholder="Filter by school..."
              value={schoolQuery}
              onChange={(e) => setSchoolQuery(e.target.value)}
              className="h-9 text-[13px] bg-muted/30 border-border/50"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-[14px] font-medium text-foreground mb-1">No profiles found</p>
            <p className="text-[12px] text-muted-foreground">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, index) => (
              <motion.div
                key={p.id}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                <div className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_hsl(var(--accent)/0.15)]">
                  <div className="flex items-center gap-3 mb-3">
                    <Link to={`/profile/${p.id}`}>
                      <Avatar className="h-11 w-11 ring-2 ring-border hover:ring-accent/30 transition-all">
                        <AvatarImage src={p.avatar_url || ""} />
                        <AvatarFallback className="text-sm">
                          {p.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${p.id}`}
                        className="text-[14px] font-semibold text-foreground hover:text-accent transition-colors truncate block"
                      >
                        {p.full_name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {p.grade || "Student"}
                        {p.school && ` · ${p.school}`}
                      </p>
                    </div>
                  </div>

                  {p.bio && (
                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {p.bio}
                    </p>
                  )}

                  {p.skills && p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/60"
                        >
                          {skill}
                        </span>
                      ))}
                      {p.skills.length > 3 && (
                        <span className="text-[10px] text-muted-foreground/50">
                          +{p.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {user && (
                    <ConnectionButton
                      currentUserId={user.id}
                      targetUserId={p.id}
                      targetUserName={p.full_name}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProfiles;
