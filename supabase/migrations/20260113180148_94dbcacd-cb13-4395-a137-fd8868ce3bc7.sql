-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more secure insert policy - users can only create notifications where they are the from_user
CREATE POLICY "Users can create notifications they send"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = from_user_id OR from_user_id IS NULL);