import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, Compass, Users as UsersIcon, FolderOpen, Shield, Menu, X, TrendingUp } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (data) setIsAdmin(true);
    });
  }, [user]);

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

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
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

  const handleMobileNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex-shrink-0">
            <motion.span
              className="text-lg md:text-xl font-bold text-gradient tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            >
              NexStep
            </motion.span>
          </Link>

          {/* Desktop Search */}
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

          {/* Desktop Right actions */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/browse">
                <UsersIcon className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link to="/discover">
                <Compass className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link to="/growth">
                <TrendingUp className="h-5 w-5" />
              </Link>
            </Button>

            {isAdmin && (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/admin">
                  <Shield className="h-5 w-5 text-primary" />
                </Link>
              </Button>
            )}

            <NotificationsMenu />
            <ThemeToggle />

            <Link to={`/profile/${user?.id}`}>
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xs font-semibold">
                  {profile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <Button size="icon" variant="ghost" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Right actions */}
          <div className="flex md:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileMenuOpen(false);
              }}
            >
              <Search className="h-5 w-5" />
            </Button>

            <NotificationsMenu />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false);
              }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border/30"
            >
              <div className="px-4 py-3" ref={containerRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects & people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim() && hasResults) setShowResults(true);
                    }}
                    className="pl-9 bg-muted/50 border-border/50"
                    autoFocus
                  />
                </div>

                {/* Mobile search results */}
                {showResults && searchQuery.trim() && (
                  <div className="mt-2 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    {!hasResults && !searching && (
                      <p className="text-[13px] text-muted-foreground text-center py-4">
                        No results for "{searchQuery}"
                      </p>
                    )}
                    {searching && (
                      <p className="text-[12px] text-muted-foreground text-center py-4">Searching...</p>
                    )}
                    {results.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleMobileNav(`/project/${p.id}`);
                          setSearchQuery("");
                          setShowResults(false);
                          setMobileSearchOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <p className="text-[13px] font-medium text-foreground truncate">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{p.description?.slice(0, 60)}</p>
                      </button>
                    ))}
                    {results.people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleMobileNav(`/profile/${p.id}`);
                          setSearchQuery("");
                          setShowResults(false);
                          setMobileSearchOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors flex items-center gap-3"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.avatar_url || ""} />
                          <AvatarFallback className="text-[10px]">{p.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{p.full_name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.grade || "Student"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden"
          >
            <div className="pt-16 px-6 space-y-1">
              {/* Profile header */}
              <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-border/30">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-sm font-semibold">{profile?.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">View Profile</p>
                </div>
              </div>

              <button
                onClick={() => handleMobileNav(`/profile/${user?.id}`)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/40 transition-colors"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-[9px]">{profile?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">My Profile</span>
              </button>

              <button
                onClick={() => handleMobileNav("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/40 transition-colors"
              >
                <FolderOpen className="h-5 w-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>

              <button
                onClick={() => handleMobileNav("/browse")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/40 transition-colors"
              >
                <UsersIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Browse Profiles</span>
              </button>

              <button
                onClick={() => handleMobileNav("/discover")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/40 transition-colors"
              >
                <Compass className="h-5 w-5" />
                <span className="text-sm font-medium">Discover</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleMobileNav("/admin")}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/40 transition-colors"
                >
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Admin Panel</span>
                </button>
              )}

              <div className="flex items-center gap-3 px-3 py-3">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">Toggle Theme</span>
              </div>

              <div className="pt-2 border-t border-border/30">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
