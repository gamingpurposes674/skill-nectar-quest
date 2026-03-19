import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Users, 
  Target,
  TrendingUp,
  Sparkles,
  BookOpen,
  LogOut,
  ChevronDown,
  Compass
} from "lucide-react";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CollaborationCard from "@/components/CollaborationCard";
import ProjectCollaborationCard from "@/components/ProjectCollaborationCard";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import FindProjectsDialog from "@/components/FindProjectsDialog";
import NotificationsMenu from "@/components/NotificationsMenu";
import PortfolioGapScanner from "@/components/PortfolioGapScanner";
import TrendingProjects from "@/components/TrendingProjects";
import SuggestedCollaborators from "@/components/SuggestedCollaborators";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AnimatedCard } from "@/components/ui/animated-card";
import { SkeletonCard, SkeletonStats } from "@/components/ui/skeleton-card";
import { CountUp } from "@/components/ui/count-up";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [collaborativeProjects, setCollaborativeProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFindProjectsDialog, setShowFindProjectsDialog] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Feed filters
  const [filterSkill, setFilterSkill] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRecency, setFilterRecency] = useState("All");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load all validated, collaboration-open projects (feed)
      const { data: feedProjectsData, error: feedProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "open")
        .eq("validation_status", "approved")
        .eq("collaboration_open", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (feedProjectsError) throw feedProjectsError;

      // Fetch profiles for feed projects
      if (feedProjectsData && feedProjectsData.length > 0) {
        const feedUserIds = [...new Set(feedProjectsData.map(p => p.user_id))];
        const { data: feedProfilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", feedUserIds);

        const feedProfilesMap = new Map(
          (feedProfilesData || []).map(p => [p.id, p])
        );

        const feedWithProfiles = feedProjectsData.map(project => ({
          ...project,
          profiles: feedProfilesMap.get(project.user_id) || null
        }));
        setProjects(feedWithProfiles);
      } else {
        setProjects([]);
      }

      // Load user's own projects
      const { data: myProjectsData, error: myProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (myProjectsError) throw myProjectsError;
      setMyProjects(myProjectsData || []);

      // Load projects where user is a collaborator
      const { data: collabProjectsData, error: collabProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("collaborator_id", user?.id)
        .order("created_at", { ascending: false });

      if (collabProjectsError) throw collabProjectsError;

      // Combine projects where user is creator or collaborator with active collaboration
      const allCollaborativeProjects = [
        ...(myProjectsData || []).filter(p => p.collaborator_id),
        ...(collabProjectsData || [])
      ];

      setCollaborativeProjects(allCollaborativeProjects);

      // Load user's achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("profile_id", user?.id);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);
      const allUserIds = new Set<string>();
      allCollaborativeProjects.forEach(p => {
        if (p.user_id) allUserIds.add(p.user_id);
        if (p.collaborator_id) allUserIds.add(p.collaborator_id);
      });

      if (allUserIds.size > 0) {
        const { data: allProfilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(allUserIds));

        const newProfilesMap = new Map(
          (allProfilesData || []).map(p => [p.id, p])
        );
        setProfilesMap(newProfilesMap);
      }

    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    loadData();
    setShowCreateDialog(false);
  };

  // Compute portfolio gaps for AI helper
  const computePortfolioGaps = (): string[] => {
    const gaps: string[] = [];
    
    // Check for research projects
    const hasResearch = myProjects.some(p => 
      p.required_skills?.includes("Research") || 
      p.description?.toLowerCase().includes("research")
    );
    if (!hasResearch) gaps.push("No research-based project");
    
    // Check for collaborative projects
    const hasCollaborative = myProjects.some(p => p.collaborator_id);
    if (!hasCollaborative) gaps.push("No collaborative project");
    
    // Check for long-term/major projects
    const hasMajorProject = myProjects.some(p => p.project_size === "major");
    if (!hasMajorProject) gaps.push("No major/long-term project");
    
    // Check project count
    if (myProjects.length < 3) gaps.push("Less than 3 total projects");
    
    // Check achievements
    if (achievements.length === 0) gaps.push("No achievements added");
    
    // Check skill count for major
    const majorSkills = profile?.skills || [];
    if (majorSkills.length < 2) gaps.push("Less than 2 skills linked to major");
    
    return gaps;
  };

  const handleRequestCollaboration = async (projectId: string) => {
    if (!user) {
      toast.error("Please sign in to collaborate");
      return;
    }

    try {
      // Check if project already has a collaborator
      const { data: projectData, error: projectCheckError } = await supabase
        .from("projects")
        .select("collaborator_id")
        .eq("id", projectId)
        .single();

      if (projectCheckError) throw projectCheckError;
      
      if (projectData?.collaborator_id) {
        toast.error("This project already has a collaborator");
        return;
      }

      // Check for existing request from this user
      const { data: existingRequest, error: checkError } = await supabase
        .from("collaboration_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("requester_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.error("You already have a pending request for this project");
        } else if (existingRequest.status === 'accepted') {
          toast.info("You're already collaborating on this project!");
        } else {
          toast.error("Your previous request was rejected");
        }
        return;
      }

      const { error } = await supabase
        .from("collaboration_requests")
        .insert({
          project_id: projectId,
          requester_id: user.id,
          message: "I'd like to collaborate on your project!",
          status: "pending"
        });

      if (error) throw error;
      toast.success("Collaboration request sent!");
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error("Failed to send collaboration request");
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav profile={null} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonStats />
              <div className="space-y-4">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={4} />
                <SkeletonCard lines={3} />
              </div>
            </div>
            <div className="space-y-6">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={3} showAvatar={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <motion.div 
      className="min-h-screen bg-background relative"
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Ambient glow orbs */}
      <div className="glow-orb w-96 h-96 bg-primary/20 -top-48 -left-48 fixed" />
      <div className="glow-orb w-72 h-72 bg-secondary/15 top-1/3 -right-36 fixed" />

      <TopNav profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div 
          className="grid gap-6 lg:grid-cols-3"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              variants={prefersReducedMotion ? undefined : containerVariants}
            >
              {/* Connections */}
              <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
                <AnimatedCard className="glass-card shadow-card p-5 card-hover-glow relative overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg scale-125 animate-glow" />
                      <div className="relative p-2.5 rounded-xl bg-primary/15 border border-primary/20">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">Connections</p>
                      <p className="text-2xl font-bold mt-0.5 tracking-tight">
                        <CountUp value={collaborativeProjects.length} />
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>

              {/* Active Projects */}
              <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
                <AnimatedCard className="glass-card shadow-card p-5 card-hover-glow relative overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-secondary/30 blur-lg scale-125 animate-glow" />
                      <div className="relative p-2.5 rounded-xl bg-secondary/15 border border-secondary/20">
                        <Target className="h-5 w-5 text-secondary" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">Active Projects</p>
                      <p className="text-2xl font-bold mt-0.5 tracking-tight">
                        <CountUp value={myProjects.length} />
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>

              {/* Portfolio Health */}
              <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
                <AnimatedCard className="glass-card shadow-card p-5 card-hover-glow relative overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-accent/20 blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-accent/30 blur-lg scale-125 animate-glow" />
                      <div className="relative p-2.5 rounded-xl bg-accent/15 border border-accent/20">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">Portfolio Health</p>
                      <p className="text-2xl font-bold mt-0.5 tracking-tight">
                        <CountUp value={profile?.portfolio_health || 0} suffix="%" />
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            </motion.div>

            {/* Main Feed */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <Tabs defaultValue="feed">
                <div className="flex justify-between items-center mb-5">
                  <TabsList className="bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/40">
                    <TabsTrigger value="feed" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--accent)/0.4)] transition-all duration-200">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Feed
                    </TabsTrigger>
                    <TabsTrigger value="my-projects" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--accent)/0.4)] transition-all duration-200">
                      My Projects
                    </TabsTrigger>
                    <TabsTrigger value="collaborations" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--accent)/0.4)] transition-all duration-200">
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Collaborations
                    </TabsTrigger>
                  </TabsList>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                      >
                        <Button className="gradient-primary shadow-glow">
                          <Plus className="h-4 w-4 mr-2" />
                          New Project
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowFindProjectsDialog(true)}>
                        <Search className="h-4 w-4 mr-2" />
                        Find Projects to Collaborate On
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <TabsContent value="feed" className="space-y-4">
                  {/* Filter bar */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                      className="h-8 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="All">All Skills</option>
                      {["Python","JavaScript","React","Java","C++","Machine Learning","Data Analysis","UI/UX Design","Graphic Design","Research","Marketing","Business Strategy"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="h-8 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {["All","Coding","Design","Research","Business","Art"].map(c => (
                        <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                      ))}
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-8 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="All">All Status</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select
                      value={filterRecency}
                      onChange={(e) => setFilterRecency(e.target.value)}
                      className="h-8 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="All">Any Time</option>
                      <option value="day">Past 24h</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                    </select>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {(() => {
                      const CATEGORY_SKILLS: Record<string, string[]> = {
                        Coding: ["Python","JavaScript","React","Java","C++","Node.js","HTML","CSS"],
                        Design: ["UI/UX Design","Graphic Design","3D Modeling","Video Editing"],
                        Research: ["Research","Data Analysis","Machine Learning"],
                        Business: ["Business Strategy","Marketing","Public Speaking"],
                        Art: ["Creative Writing","Photography","Graphic Design","Video Editing"],
                      };

                      const filteredProjects = projects.filter(p => {
                        const skills = p.required_skills || [];
                        if (filterSkill !== "All" && !skills.includes(filterSkill)) return false;
                        if (filterCategory !== "All") {
                          const catSkills = CATEGORY_SKILLS[filterCategory] || [];
                          if (!skills.some((s: string) => catSkills.includes(s))) return false;
                        }
                        if (filterStatus !== "All") {
                          if (filterStatus === "completed" && !p.is_complete) return false;
                          if (filterStatus === "in_progress" && (!p.collaborator_id || p.is_complete)) return false;
                          if (filterStatus === "open" && (p.collaborator_id || p.is_complete)) return false;
                        }
                        if (filterRecency !== "All") {
                          const age = Date.now() - new Date(p.created_at).getTime();
                          const DAY = 86400000;
                          if (filterRecency === "day" && age > DAY) return false;
                          if (filterRecency === "week" && age > DAY * 7) return false;
                          if (filterRecency === "month" && age > DAY * 30) return false;
                        }
                        return true;
                      });

                      if (filteredProjects.length === 0) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <Card className="glass-card shadow-card p-8 text-center">
                              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                              <p className="text-sm text-muted-foreground">
                                Try adjusting your filters
                              </p>
                            </Card>
                          </motion.div>
                        );
                      }

                      return filteredProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          layout
                        >
                          <CollaborationCard
                            id={project.id}
                            title={project.title}
                            author={project.profiles?.full_name || "Unknown User"}
                            authorId={project.user_id}
                            ownerId={project.user_id}
                            avatar={project.profiles?.avatar_url || ""}
                            description={project.description}
                            skills={project.required_skills || []}
                            timePosted={getTimeAgo(project.created_at)}
                            coverImageUrl={project.proof_file_url}
                            onRequestCollaboration={() => handleRequestCollaboration(project.id)}
                          />
                        </motion.div>
                      ));
                    })()}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="my-projects">
                  <AnimatePresence mode="popLayout">
                    {myProjects.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Card className="glass-card shadow-card p-8 text-center">
                          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Start collaborating by creating your first project
                          </p>
                          <motion.div
                            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                          >
                            <Button 
                              className="gradient-primary"
                              onClick={() => setShowCreateDialog(true)}
                            >
                              Create Project
                            </Button>
                          </motion.div>
                        </Card>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {myProjects.map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            layout
                          >
                            {project.collaborator_id ? (
                              <ProjectCollaborationCard
                                project={project}
                                creatorProfile={profilesMap.get(project.user_id)}
                                collaboratorProfile={profilesMap.get(project.collaborator_id)}
                                onUpdate={loadData}
                              />
                            ) : (
                              <AnimatedCard className="glass-card shadow-card p-6">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-lg">{project.title}</h3>
                                      {project.validation_status && (
                                        <Badge 
                                          variant={project.validation_status === 'approved' ? 'default' : 'destructive'}
                                          className="text-xs"
                                        >
                                          {project.validation_status}
                                        </Badge>
                                      )}
                                      {project.collaboration_open && project.validation_status === 'approved' && (
                                        <Badge variant="secondary" className="text-xs">
                                          Open for Collaboration
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                    {project.validation_status !== 'approved' && (
                                      <p className="text-xs text-destructive mt-2">
                                        Not counted — Invalid or irrelevant submission
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {project.required_skills?.map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{project.status}</Badge>
                                </div>
                              </AnimatedCard>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="collaborations">
                  <AnimatePresence mode="popLayout">
                    {collaborativeProjects.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Card className="glass-card shadow-card p-8 text-center">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No active collaborations</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Find projects to collaborate on or wait for requests on your projects
                          </p>
                          <motion.div
                            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                          >
                            <Button 
                              className="gradient-primary"
                              onClick={() => setShowFindProjectsDialog(true)}
                            >
                              Find Projects
                            </Button>
                          </motion.div>
                        </Card>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {collaborativeProjects.map((project, index) => (
                          <motion.div
                            key={project.id}
                            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            layout
                          >
                            <ProjectCollaborationCard
                              project={project}
                              creatorProfile={profilesMap.get(project.user_id)}
                              collaboratorProfile={profilesMap.get(project.collaborator_id)}
                              onUpdate={loadData}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Trending This Week */}
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <TrendingProjects />
            </motion.div>

            {/* Suggested Collaborators */}
            {user && profile?.skills && (
              <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
                <SuggestedCollaborators
                  currentUserId={user.id}
                  currentUserSkills={profile.skills}
                />
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <motion.div 
            className="space-y-6"
            variants={prefersReducedMotion ? undefined : containerVariants}
          >
            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <AnimatedCard className="glass-card shadow-card p-6">
                <Link to={`/profile/${user?.id}`}>
                  <motion.div 
                    className="flex items-center gap-3 mb-4 cursor-pointer"
                    whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.grade || "Student"}</p>
                    </div>
                  </motion.div>
                </Link>
                <motion.div
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                >
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/profile/${user?.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </motion.div>
              </AnimatedCard>
            </motion.div>

            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <PortfolioGapScanner
                profile={profile}
                projects={myProjects}
                achievements={achievements}
                collaborativeProjects={collaborativeProjects}
              />
            </motion.div>

            <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
              <AnimatedCard className="glass-card shadow-card p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={`/profile/${user?.id}`}>
                        <Users className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </AnimatedCard>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <CreateProjectDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleProjectCreated}
        userMajor={profile?.major}
        userGrade={profile?.grade}
        userSkills={profile?.skills}
        existingProjects={myProjects}
        portfolioGaps={computePortfolioGaps()}
      />
      
      <FindProjectsDialog
        open={showFindProjectsDialog}
        onOpenChange={setShowFindProjectsDialog}
      />
    </motion.div>
  );
};

export default Dashboard;
