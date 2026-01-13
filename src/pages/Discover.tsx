import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Users, Sparkles } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { motion, Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  grade: string | null;
  major: string | null;
  school: string | null;
  dream_college: string | null;
  portfolio_health: number | null;
  skills: string[] | null;
  bio: string | null;
  location: string | null;
}

const Discover = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPublicProfiles();
  }, []);

  const loadPublicProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, grade, major, school, dream_college, portfolio_health, skills, bio, location")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (grade: string | null) => {
    if (!grade) return { label: "STUDENT", variant: "secondary" as const };
    const gradeLower = grade.toLowerCase();
    if (gradeLower.includes("graduate") || gradeLower.includes("college") || gradeLower.includes("university")) {
      return { label: "SENIOR", variant: "default" as const };
    }
    return { label: "STUDENT", variant: "secondary" as const };
  };

  // Fuzzy search implementation
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact substring match
    if (textLower.includes(queryLower)) return true;
    
    // Typo-tolerant matching using Levenshtein-like approach
    const words = queryLower.split(" ").filter(w => w.length > 0);
    return words.every(word => {
      // Check each word against text
      const textWords = textLower.split(/\s+/);
      return textWords.some(tw => {
        if (tw.includes(word) || word.includes(tw)) return true;
        // Allow 1-2 character difference for typo tolerance
        if (Math.abs(tw.length - word.length) <= 2) {
          let matches = 0;
          const shorter = tw.length < word.length ? tw : word;
          const longer = tw.length < word.length ? word : tw;
          for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) matches++;
          }
          return matches >= shorter.length * 0.7;
        }
        return false;
      });
    });
  };

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    
    return profiles.filter((profile) => {
      const searchFields = [
        profile.full_name,
        profile.major,
        profile.school,
        profile.dream_college,
        profile.bio,
        profile.location,
        ...(profile.skills || [])
      ].filter(Boolean).join(" ");
      
      return fuzzyMatch(searchFields, searchQuery);
    });
  }, [profiles, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Discover</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, major, skills, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg rounded-full border-2 focus:border-primary transition-colors"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {filteredProfiles.length} public profile{filteredProfiles.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </motion.div>

        {/* Profiles Grid */}
        {filteredProfiles.length === 0 ? (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No profiles found</h2>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "No public profiles available yet"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProfiles.map((profile, index) => {
              const status = getStatusBadge(profile.grade);
              return (
                <motion.div
                  key={profile.id}
                  variants={staggerItemVariants}
                >
                  <AnimatedCard
                    className="cursor-pointer h-full"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xl bg-primary/10">
                            {profile.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1 w-full">
                          {profile.grade && (
                            <p className="truncate">Grade: {profile.grade}</p>
                          )}
                          {profile.major && (
                            <p className="truncate">{profile.major}</p>
                          )}
                          {profile.school && (
                            <p className="truncate text-xs">{profile.school}</p>
                          )}
                        </div>

                        {/* Portfolio Health */}
                        <div className="w-full pt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Portfolio Health</span>
                            <span className="font-medium">{profile.portfolio_health || 0}%</span>
                          </div>
                          <AnimatedProgress value={profile.portfolio_health || 0} className="h-2" />
                        </div>

                        {/* Skills Preview */}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {profile.skills.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {profile.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{profile.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </AnimatedCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Discover;
