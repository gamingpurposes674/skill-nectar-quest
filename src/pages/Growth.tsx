import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Trophy,
  Users,
  FolderOpen,
  Star,
  Rocket,
  ThumbsUp,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { CountUp } from "@/components/ui/count-up";
import { toTitleCase } from "@/lib/textValidation";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "project_created" | "collaboration" | "achievement" | "reaction";
  title: string;
  description: string;
  date: string;
  icon: typeof TrendingUp;
  color: string;
}

interface MilestoneItem {
  label: string;
  achieved: boolean;
  icon: typeof Trophy;
}

const Growth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [healthSnapshots, setHealthSnapshots] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadGrowthData();
  }, [user]);

  const loadGrowthData = async () => {
    try {
      const [
        { data: profileData },
        { data: projectsData },
        { data: achievementsData },
        { data: reactionsData },
        { data: collabData },
        { data: snapshotsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase
          .from("projects")
          .select("*")
          .or(`user_id.eq.${user!.id},collaborator_id.eq.${user!.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("achievements")
          .select("*")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("feedback")
          .select("*")
          .eq("profile_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("*")
          .not("collaborator_id", "is", null)
          .or(`user_id.eq.${user!.id},collaborator_id.eq.${user!.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("portfolio_health_snapshots")
          .select("*")
          .eq("user_id", user!.id)
          .order("recorded_at", { ascending: true })
          .limit(30),
      ]);

      setProfile(profileData);
      setProjects(projectsData || []);
      setAchievements(achievementsData || []);
      setReactions(reactionsData || []);
      setCollaborations(collabData || []);
      setHealthSnapshots(snapshotsData || []);

      // Record a snapshot of current health
      if (profileData) {
        const currentHealth = profileData.portfolio_health || 0;
        const projectCount = (projectsData || []).length;
        const achievementCount = (achievementsData || []).length;
        const collabCount = (collabData || []).length;

        // Only insert if no snapshot today
        const today = new Date().toISOString().split("T")[0];
        const hasToday = (snapshotsData || []).some(
          (s: any) => s.recorded_at?.split("T")[0] === today
        );

        if (!hasToday) {
          await supabase.from("portfolio_health_snapshots").insert({
            user_id: user!.id,
            health_value: currentHealth,
            project_count: projectCount,
            achievement_count: achievementCount,
            collaboration_count: collabCount,
          });
        }
      }
    } catch (error) {
      console.error("Error loading growth data:", error);
      toast.error("Failed to load growth data");
    } finally {
      setLoading(false);
    }
  };

  // Build timeline events
  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    projects.forEach((p) => {
      events.push({
        id: `project-${p.id}`,
        type: "project_created",
        title: toTitleCase(p.title),
        description: p.collaborator_id
          ? "Collaborative project"
          : "Solo project created",
        date: p.created_at,
        icon: FolderOpen,
        color: "text-secondary",
      });
    });

    achievements.forEach((a) => {
      events.push({
        id: `achievement-${a.id}`,
        type: "achievement",
        title: toTitleCase(a.title),
        description: a.description || "Achievement unlocked",
        date: a.created_at || a.date_achieved,
        icon: Trophy,
        color: "text-yellow-400",
      });
    });

    collaborations
      .filter((c) => c.is_complete)
      .forEach((c) => {
        events.push({
          id: `collab-${c.id}`,
          type: "collaboration",
          title: `Completed: ${toTitleCase(c.title)}`,
          description: "Collaboration completed successfully",
          date: c.updated_at || c.created_at,
          icon: Users,
          color: "text-accent",
        });
      });

    reactions.forEach((r) => {
      events.push({
        id: `reaction-${r.id}`,
        type: "reaction",
        title: `${r.reaction_type || "Feedback"} received`,
        description: r.comment || "Someone reacted to your work",
        date: r.created_at,
        icon: ThumbsUp,
        color: "text-primary",
      });
    });

    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [projects, achievements, collaborations, reactions]);

  // Build chart data
  const chartData = useMemo(() => {
    if (healthSnapshots.length === 0) {
      // Generate synthetic data from current health
      const health = profile?.portfolio_health || 0;
      return [
        { date: "Start", health: 0 },
        { date: "Now", health },
      ];
    }
    return healthSnapshots.map((s: any) => ({
      date: format(new Date(s.recorded_at), "MMM d"),
      health: s.health_value,
    }));
  }, [healthSnapshots, profile]);

  const chartConfig = {
    health: {
      label: "Portfolio Health",
      color: "hsl(var(--accent))",
    },
  };

  // Milestones
  const milestones = useMemo<MilestoneItem[]>(() => {
    const projectCount = projects.filter((p) => p.user_id === user?.id).length;
    const collabCount = collaborations.length;
    const achievementCount = achievements.length;
    const reactionCount = reactions.length;
    const health = profile?.portfolio_health || 0;

    return [
      {
        label: "First Project Created",
        achieved: projectCount >= 1,
        icon: Rocket,
      },
      {
        label: "3 Projects Milestone",
        achieved: projectCount >= 3,
        icon: FolderOpen,
      },
      {
        label: "First Collaboration",
        achieved: collabCount >= 1,
        icon: Users,
      },
      {
        label: "First Achievement Added",
        achieved: achievementCount >= 1,
        icon: Trophy,
      },
      {
        label: "5 Reactions Received",
        achieved: reactionCount >= 5,
        icon: Star,
      },
      {
        label: "Portfolio Health 25%",
        achieved: health >= 25,
        icon: TrendingUp,
      },
      {
        label: "Portfolio Health 50%",
        achieved: health >= 50,
        icon: TrendingUp,
      },
      {
        label: "Portfolio Health 75%",
        achieved: health >= 75,
        icon: TrendingUp,
      },
    ];
  }, [projects, collaborations, achievements, reactions, profile, user]);

  const achievedCount = milestones.filter((m) => m.achieved).length;

  const getTimeAgo = (date: string) => {
    if (!date) return "";
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav profile={null} />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-background relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glow-orb w-96 h-96 bg-accent/15 -top-48 -left-48 fixed" />
      <div className="glow-orb w-72 h-72 bg-primary/10 top-1/3 -right-36 fixed" />

      <TopNav profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              My Growth
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your progress, milestones, and portfolio evolution
            </p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Projects",
              value: projects.filter((p) => p.user_id === user?.id).length,
              icon: FolderOpen,
              colorClass: "text-secondary",
            },
            {
              label: "Collaborations",
              value: collaborations.length,
              icon: Users,
              colorClass: "text-accent",
            },
            {
              label: "Achievements",
              value: achievements.length,
              icon: Trophy,
              colorClass: "text-yellow-400",
            },
            {
              label: "Reactions",
              value: reactions.length,
              icon: ThumbsUp,
              colorClass: "text-primary",
            },
          ].map((stat) => (
            <AnimatedCard
              key={stat.label}
              className="glass-card p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <stat.icon className={`h-4 w-4 ${stat.colorClass}`} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold">
                    <CountUp value={stat.value} />
                  </p>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Column - Chart & Milestones */}
          <div className="lg:col-span-3 space-y-8">
            {/* Portfolio Health Graph */}
            <AnimatedCard className="glass-card shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className="text-lg font-bold text-foreground"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Portfolio Health Over Time
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your portfolio growth trajectory
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-accent/15 text-accent border-accent/20"
                >
                  {profile?.portfolio_health || 0}%
                </Badge>
              </div>

              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="healthGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--accent))"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--accent))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="health"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#healthGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </AnimatedCard>

            {/* Milestones */}
            <AnimatedCard className="glass-card shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className="text-lg font-bold text-foreground"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Milestones
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {achievedCount} of {milestones.length} achieved
                  </p>
                </div>
              </div>

              <AnimatedProgress
                value={(achievedCount / milestones.length) * 100}
                className="h-2 mb-5"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {milestones.map((m) => (
                  <div
                    key={m.label}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      m.achieved
                        ? "border-accent/30 bg-accent/5"
                        : "border-border/30 bg-muted/20 opacity-60"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${
                        m.achieved ? "bg-accent/20" : "bg-muted/40"
                      }`}
                    >
                      <m.icon
                        className={`h-4 w-4 ${
                          m.achieved
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        m.achieved
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {m.label}
                    </span>
                    {m.achieved && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-accent/15 text-accent text-[10px] px-1.5"
                      >
                        ✓
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="lg:col-span-2">
            <AnimatedCard className="glass-card shadow-card p-6">
              <h2
                className="text-lg font-bold text-foreground mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Activity Timeline
              </h2>

              {timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Rocket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Start by creating a project!
                  </p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/40" />

                  {timeline.slice(0, 20).map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative flex gap-4 py-3"
                    >
                      <div
                        className={`relative z-10 flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center bg-muted/60 border border-border/40`}
                      >
                        <event.icon
                          className={`h-3.5 w-3.5 ${event.color}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-tight truncate">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {event.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {getTimeAgo(event.date)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatedCard>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Growth;
