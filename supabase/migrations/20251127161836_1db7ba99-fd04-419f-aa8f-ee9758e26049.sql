-- Add collaboration fields to projects table
ALTER TABLE public.projects 
ADD COLUMN collaborator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN is_complete boolean DEFAULT false,
ADD COLUMN creator_completed boolean DEFAULT false,
ADD COLUMN collaborator_completed boolean DEFAULT false;

-- Create project chat messages table
CREATE TABLE public.project_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat messages
ALTER TABLE public.project_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Only project creator and collaborator can view messages
CREATE POLICY "Project participants can view chat messages"
ON public.project_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_chat_messages.project_id
    AND (p.user_id = auth.uid() OR p.collaborator_id = auth.uid())
  )
);

-- RLS: Only project creator and collaborator can send messages (if project not complete)
CREATE POLICY "Project participants can send chat messages"
ON public.project_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_chat_messages.project_id
    AND (p.user_id = auth.uid() OR p.collaborator_id = auth.uid())
    AND p.is_complete = false
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_chat_messages;

-- Create index for faster chat queries
CREATE INDEX idx_chat_messages_project_id ON public.project_chat_messages(project_id);
CREATE INDEX idx_chat_messages_created_at ON public.project_chat_messages(created_at);