import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { validateDateInput } from "@/lib/dateValidation";
import {
  Send,
  Milestone,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectLogEntry {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: { full_name: string; avatar_url: string | null };
}

interface ProjectMilestoneEntry {
  id: string;
  title: string;
  milestone_date: string;
  completed: boolean;
  author_id: string;
  created_at: string;
}

interface ProjectLogSectionProps {
  projectId: string;
  isParticipant: boolean;
  project: any;
}

// ── Project Log (Build-in-Public Updates) ──
export const ProjectLogSection = ({ projectId, isParticipant, project }: ProjectLogSectionProps) => {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [logs, setLogs] = useState<ProjectLogEntry[]>([]);
  const [newLog, setNewLog] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLogs();

    // Realtime subscription
    const channel = supabase
      .channel(`project-logs-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_logs", filter: `project_id=eq.${projectId}` }, () => {
        loadLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("project_logs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (data) {
      // Load author profiles
      const authorIds = [...new Set(data.map((l: any) => l.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      setLogs(data.map((l: any) => ({ ...l, author: profileMap.get(l.author_id) })));
    }
  };

  const handlePostLog = async () => {
    if (!user || !newLog.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("project_logs").insert({
        project_id: projectId,
        author_id: user.id,
        content: newLog.trim(),
      });
      if (error) throw error;
      setNewLog("");
      toast.success("Update posted!");
      loadLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to post update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-accent" />
        <h2 className="text-[14px] font-semibold text-foreground">Project Log</h2>
        <span className="text-[11px] text-muted-foreground">({logs.length})</span>
      </div>

      {/* Post input */}
      {isParticipant && !project?.is_complete && (
        <div className="flex gap-2 mb-4">
          <Textarea
            placeholder="Share a progress update..."
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            rows={2}
            className="text-[13px] bg-muted/30 border-border/50 resize-none flex-1"
          />
          <Button
            size="icon"
            onClick={handlePostLog}
            disabled={!newLog.trim() || submitting}
            className="h-10 w-10 flex-shrink-0 gradient-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Log entries */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-[12px] text-muted-foreground/60 text-center py-4">
            No updates yet
          </p>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={log.id}
              className="flex gap-3 py-2.5 border-b border-border/20 last:border-0"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/profile/${log.author_id}`}>
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={log.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{log.author?.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-medium text-foreground">{log.author?.full_name || "User"}</span>
                  <span className="text-[10px] text-muted-foreground/50">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{log.content}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// ── Milestone Timeline ──
interface MilestoneTimelineProps {
  projectId: string;
  isParticipant: boolean;
}

export const MilestoneTimeline = ({ projectId, isParticipant }: MilestoneTimelineProps) => {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [milestones, setMilestones] = useState<ProjectMilestoneEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    const { data } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("milestone_date", { ascending: true });
    setMilestones(data || []);
  };

  const handleAdd = async () => {
    if (!user || !newTitle.trim() || !newDate) return;

    const validationError = validateDateInput(newDate);
    if (validationError) {
      setDateError(validationError);
      return;
    }
    setDateError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.from("project_milestones").insert({
        project_id: projectId,
        author_id: user.id,
        title: newTitle.trim(),
        milestone_date: newDate,
      });
      if (error) throw error;
      setNewTitle("");
      setNewDate("");
      setShowAdd(false);
      toast.success("Milestone added!");
      loadMilestones();
    } catch (err: any) {
      toast.error(err.message || "Failed to add milestone");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Milestone className="h-4 w-4 text-primary" />
          <h2 className="text-[14px] font-semibold text-foreground">Milestones</h2>
        </div>
        {isParticipant && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Milestone title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-[13px] h-9 bg-muted/30"
                />
              </div>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewDate(value);
                  setDateError(value ? validateDateInput(value) : "Date is required");
                }}
                className="text-[13px] h-9 w-36 bg-muted/30"
              />
              <Button size="sm" className="h-9" onClick={handleAdd} disabled={!newTitle.trim() || !newDate || submitting}>
                Add
              </Button>
            </div>
            {dateError && <p className="text-[10px] text-destructive mt-1">{dateError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      {milestones.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/60 text-center py-4">
          No milestones yet
        </p>
      ) : (
        <div className="relative">
          {/* Horizontal scrollable timeline */}
          <div className="flex gap-0 overflow-x-auto pb-2 scrollbar-thin">
            {milestones.map((ms, i) => (
              <motion.div
                key={ms.id}
                className="flex flex-col items-center min-w-[120px] relative"
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {/* Connector line */}
                {i < milestones.length - 1 && (
                  <div className="absolute top-[18px] left-[60px] w-full h-0.5 bg-border/50 z-0" />
                )}
                {/* Dot */}
                <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                  ms.completed
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                {/* Label */}
                <p className="text-[11px] font-medium text-foreground mt-2 text-center max-w-[100px] leading-tight">
                  {ms.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Calendar className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <p className="text-[9px] text-muted-foreground/50">
                    {validateDateInput(ms.milestone_date) ? "Invalid date" : new Date(ms.milestone_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
