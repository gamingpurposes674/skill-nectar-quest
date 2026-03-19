import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, Compass, Users as UsersIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationsMenu from "@/components/NotificationsMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { supabase } from "@/integrations/supabase/client";

interface TopNavProps {
  profile?: {
    avatar_url?: string;
    full_name?: string;
  } | null;
}

interface SearchResult {
  projects: { id: string; title: string; description: string; required_skills: string[] | null }[];
  people: { id: string; full_name: string; avatar_url: string | null; grade: string | null; skills: string[] | null }[];
}

export default function TopNav({ profile }: TopNavProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ projects: [], people: [] });
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ projects: [], people: [] });
      setShowResults(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(searchQuery.trim()), 250);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const runSearch = async (q: string) => {
    setSearching(true);
    const pattern = `%${q}%`;

    const [projectsRes, peopleRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, description, required_skills")
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .eq("validation_status", "approved")
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, grade, skills")
        .ilike("full_name", pattern)
        .limit(5),
    ]);

    setResults({
      projects: projectsRes.data || [],
      people: peopleRes.data || [],
    });
    setShowResults(true);
    setSearching(false);
  };

  const hasResults = results.projects.length > 0 || results.people.length > 0;

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex-shrink-0">
          <motion.span
            className="text-xl font-bold text-gradient tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          >
            NexStep
          </motion.span>
        </Link>

        {/* Search */}
        <div ref={containerRef} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects & people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() && hasResults) setShowResults(true);
              }}
              className="pl-9 bg-muted/50 border-border/50 focus:bg-muted/80 transition-colors"
            />
          </div>

          {/* Dropdown results */}
          <AnimatePresence>
            {showResults && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto"
              >
                {!hasResults && !searching && (
                  <p className="text-[13px] text-muted-foreground text-center py-6">
                    No results for "{searchQuery}"
                  </p>
                )}

                {searching && (
                  <p className="text-[12px] text-muted-foreground text-center py-4">
                    Searching...
                  </p>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                      <FolderOpen className="h-3 w-3" />
                      Projects
                    </div>
                    {results.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          navigate(`/project/${p.id}`);
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.description?.slice(0, 60)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* People */}
                {results.people.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                      <UsersIcon className="h-3 w-3" />
                      People
                    </div>
                    {results.people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          navigate(`/profile/${p.id}`);
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors flex items-center gap-3"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.avatar_url || ""} />
                          <AvatarFallback className="text-[10px]">
                            {p.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {p.full_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.grade || "Student"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/browse">
                <UsersIcon className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Button variant="ghost" size="icon" asChild>
              <Link to="/discover">
                <Compass className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <NotificationsMenu />
          <ThemeToggle />

          <Link to={`/profile/${user?.id}`}>
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            >
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xs font-semibold">
                  {profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </Link>

          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Button size="icon" variant="ghost" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  );
}
