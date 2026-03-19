import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VerifiedSkillsResult {
  verifiedSkills: Set<string>;
  loading: boolean;
}

/**
 * A skill is "verified" when the user has completed at least one project
 * using that skill AND that project has received 5+ reactions (feedback rows).
 */
export const useVerifiedSkills = (userId: string | undefined): VerifiedSkillsResult => {
  const [verifiedSkills, setVerifiedSkills] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const load = async () => {
      try {
        // Get completed projects by user (as creator or collaborator)
        const { data: projects } = await supabase
          .from("projects")
          .select("id, required_skills, user_id, collaborator_id, is_complete")
          .or(`user_id.eq.${userId},collaborator_id.eq.${userId}`)
          .eq("is_complete", true);

        if (!projects || projects.length === 0) {
          setVerifiedSkills(new Set());
          setLoading(false);
          return;
        }

        // Count reactions per project
        const projectIds = projects.map((p) => p.id);
        const { data: feedbackData } = await supabase
          .from("feedback")
          .select("profile_id, reaction_type, project_id")
          .in("project_id", projectIds);

        // Also count feedback where profile_id = userId (legacy reactions)
        const { data: profileFeedback } = await supabase
          .from("feedback")
          .select("reaction_type")
          .eq("profile_id", userId);

        const projectReactionCounts = new Map<string, number>();
        (feedbackData || []).forEach((f) => {
          if (f.reaction_type && f.project_id) {
            projectReactionCounts.set(f.project_id, (projectReactionCounts.get(f.project_id) || 0) + 1);
          }
        });

        // Total profile-level reactions as bonus
        const totalProfileReactions = (profileFeedback || []).filter((f) => f.reaction_type).length;

        const verified = new Set<string>();
        projects.forEach((p) => {
          const reactionCount = (projectReactionCounts.get(p.id) || 0);
          // A project qualifies if it has 5+ reactions (or user has 5+ total profile reactions)
          if (reactionCount >= 5 || totalProfileReactions >= 5) {
            (p.required_skills || []).forEach((skill: string) => verified.add(skill));
          }
        });

        setVerifiedSkills(verified);
      } catch (err) {
        console.error("Error loading verified skills:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { verifiedSkills, loading };
};

/**
 * Compute collab reputation score and tier.
 */
export interface CollabScoreResult {
  score: number;
  tier: string;
  tierColor: string;
}

export const useCollabScore = (userId: string | undefined): CollabScoreResult & { loading: boolean } => {
  const [result, setResult] = useState<CollabScoreResult>({ score: 0, tier: "Newcomer", tierColor: "text-muted-foreground" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const load = async () => {
      try {
        // Completed collaborations (user was creator or collaborator)
        const { data: completedCollabs } = await supabase
          .from("projects")
          .select("id")
          .or(`user_id.eq.${userId},collaborator_id.eq.${userId}`)
          .eq("is_complete", true)
          .not("collaborator_id", "is", null);

        const collabCount = completedCollabs?.length || 0;

        // Reactions received on user's projects
        const { data: userProjects } = await supabase
          .from("projects")
          .select("id")
          .eq("user_id", userId);

        let reactionCount = 0;
        let commentCount = 0;

        if (userProjects && userProjects.length > 0) {
          const projectIds = userProjects.map((p) => p.id);
          const { data: feedback } = await supabase
            .from("feedback")
            .select("reaction_type, comment, project_id")
            .in("project_id", projectIds);

          (feedback || []).forEach((f) => {
            if (f.reaction_type) reactionCount++;
            if (f.comment) commentCount++;
          });
        }

        // Also count profile-level feedback
        const { data: profileFeedback } = await supabase
          .from("feedback")
          .select("reaction_type, comment")
          .eq("profile_id", userId);

        (profileFeedback || []).forEach((f) => {
          if (f.reaction_type) reactionCount++;
          if (f.comment) commentCount++;
        });

        // Score: collabs * 20 + reactions * 2 + comments * 5
        const score = collabCount * 20 + reactionCount * 2 + commentCount * 5;

        let tier = "Newcomer";
        let tierColor = "text-muted-foreground";

        if (score >= 200) { tier = "Legend"; tierColor = "text-yellow-400"; }
        else if (score >= 120) { tier = "Veteran"; tierColor = "text-purple-400"; }
        else if (score >= 60) { tier = "Contributor"; tierColor = "text-accent"; }
        else if (score >= 20) { tier = "Rising Star"; tierColor = "text-primary"; }

        setResult({ score, tier, tierColor });
      } catch (err) {
        console.error("Error computing collab score:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { ...result, loading };
};
