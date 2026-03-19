-- 1) Ensure required foreign keys exist for feedback joins (comments/reactions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_author_id_fkey') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_profile_id_fkey') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_project_id_fkey') THEN
    ALTER TABLE public.feedback
      ADD CONSTRAINT feedback_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) Tighten RLS to remove public exposure (still works because app pages are behind auth)
-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- feedback
DROP POLICY IF EXISTS "Feedback is viewable by everyone" ON public.feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback;

CREATE POLICY "Feedback is viewable by authenticated users"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  (is_anonymous IS DISTINCT FROM true)
  OR (auth.uid() = author_id)
  OR (auth.uid() = profile_id)
);

CREATE POLICY "Users can create feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 3) Add missing UPDATE/DELETE policies for advice_messages
CREATE POLICY "Recipients can update their advice messages"
ON public.advice_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Recipients can delete their advice messages"
ON public.advice_messages
FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);

-- 4) Fix linter warnings: set immutable search_path for SECURITY DEFINER / trigger functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id::text)
  );
  RETURN NEW;
END;
$function$;