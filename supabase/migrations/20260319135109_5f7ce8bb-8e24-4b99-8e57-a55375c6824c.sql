
-- Project logs (build-in-public updates)
CREATE TABLE public.project_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project logs are viewable by everyone" ON public.project_logs
  FOR SELECT TO public USING (true);

CREATE POLICY "Project participants can create logs" ON public.project_logs
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_logs.project_id
        AND (p.user_id = auth.uid() OR p.collaborator_id = auth.uid())
    )
  );

CREATE POLICY "Authors can delete own logs" ON public.project_logs
  FOR DELETE TO public USING (auth.uid() = author_id);

-- Project milestones
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  milestone_date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones are viewable by everyone" ON public.project_milestones
  FOR SELECT TO public USING (true);

CREATE POLICY "Project participants can create milestones" ON public.project_milestones
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_milestones.project_id
        AND (p.user_id = auth.uid() OR p.collaborator_id = auth.uid())
    )
  );

CREATE POLICY "Authors can delete own milestones" ON public.project_milestones
  FOR DELETE TO public USING (auth.uid() = author_id);

-- Enable realtime for project logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_logs;
