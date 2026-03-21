
-- Table to track portfolio health snapshots over time
CREATE TABLE public.portfolio_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_value integer NOT NULL DEFAULT 0,
  project_count integer NOT NULL DEFAULT 0,
  achievement_count integer NOT NULL DEFAULT 0,
  collaboration_count integer NOT NULL DEFAULT 0,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
ON public.portfolio_health_snapshots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON public.portfolio_health_snapshots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for efficient querying
CREATE INDEX idx_portfolio_snapshots_user_date ON public.portfolio_health_snapshots(user_id, recorded_at DESC);
