-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id)
);

-- Create notifications table for all notification types
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'new_feedback', 'new_reaction', 'project_update', 'portfolio_update')),
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type TEXT,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Connections RLS Policies
CREATE POLICY "Users can view their own connections"
ON public.connections FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connection requests"
ON public.connections FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they are part of"
ON public.connections FOR UPDATE
USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Users can delete their own connection requests"
ON public.connections FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Update feedback table to support new reaction types
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_reaction_type_check;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_reaction_type_check 
CHECK (reaction_type IN ('thumbsup', 'grin', 'heart', 'smile', 'neutral', 'sad'));

-- Add RLS for advice_messages if not exists
ALTER TABLE public.advice_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own advice messages"
ON public.advice_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send advice messages"
ON public.advice_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Add feedback update policy
CREATE POLICY "Users can update their own feedback"
ON public.feedback FOR UPDATE
USING (auth.uid() = author_id);

-- Enable realtime for notifications and connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- Create trigger for updated_at on connections
CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_addressee ON public.connections(addressee_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Create text search index for fuzzy profile search
CREATE INDEX idx_profiles_fullname_search ON public.profiles USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_profiles_major_search ON public.profiles USING gin(to_tsvector('english', COALESCE(major, '')));
CREATE INDEX idx_profiles_skills_search ON public.profiles USING gin(skills);