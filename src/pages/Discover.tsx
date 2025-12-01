import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, GraduationCap, Target, ArrowLeft, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Discover = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPublicProfiles();
  }, []);

  const loadPublicProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading public profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (grade: string | null) => {
    if (!grade) return "STUDENT";
    const gradeNum = parseInt(grade);
    if (gradeNum >= 12 || grade.toLowerCase().includes("college") || grade.toLowerCase().includes("graduate")) {
      return "SENIOR";
    }
    return "STUDENT";
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (profile.major && profile.major.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (profile.school && profile.school.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Discover
            </h1>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, major, or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Profile Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No profiles match your search." : "No public profiles available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Link key={profile.id} to={`/profile/${profile.id}`}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {profile.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name and Status */}
                    <div>
                      <h3 className="text-xl font-semibold">{profile.full_name}</h3>
                      <Badge variant="secondary" className="mt-2">
                        {getStatusBadge(profile.grade)}
                      </Badge>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2 text-sm text-muted-foreground w-full">
                      {profile.age && (
                        <p>Age: {profile.age}</p>
                      )}
                      {profile.grade && (
                        <div className="flex items-center justify-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>Grade: {profile.grade}</span>
                        </div>
                      )}
                      {profile.major && (
                        <div className="flex items-center justify-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>{profile.major}</span>
                        </div>
                      )}
                      {profile.dream_college && (
                        <div className="flex items-center justify-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>Dream: {profile.dream_college}</span>
                        </div>
                      )}
                      {profile.school && (
                        <div className="flex items-center justify-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.school}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
