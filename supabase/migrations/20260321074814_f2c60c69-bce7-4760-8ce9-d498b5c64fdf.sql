
-- Mentor profiles table
CREATE TABLE public.mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  expertise text[] NOT NULL DEFAULT '{}',
  availability text NOT NULL DEFAULT 'Open',
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentor profiles are viewable by authenticated users"
ON public.mentor_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own mentor profile"
ON public.mentor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentor profile"
ON public.mentor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mentor profile"
ON public.mentor_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mentorship chat messages table
CREATE TABLE public.mentorship_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id uuid NOT NULL REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mentorship_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentorship participants can view messages"
ON public.mentorship_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.mentorship_requests mr
  WHERE mr.id = mentorship_messages.mentorship_id
  AND (mr.mentor_id = auth.uid() OR mr.mentee_id = auth.uid())
));

CREATE POLICY "Mentorship participants can send messages"
ON public.mentorship_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.mentorship_requests mr
    WHERE mr.id = mentorship_messages.mentorship_id
    AND mr.status = 'accepted'
    AND (mr.mentor_id = auth.uid() OR mr.mentee_id = auth.uid())
  )
);

-- Enable realtime for mentorship messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_messages;

-- Index for efficient chat queries
CREATE INDEX idx_mentorship_messages_mentorship ON public.mentorship_messages(mentorship_id, created_at);
