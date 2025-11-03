-- Add project_size column to projects table
ALTER TABLE public.projects
ADD COLUMN project_size text DEFAULT 'small' CHECK (project_size IN ('small', 'medium', 'major'));

-- Add proof_file_url column to projects table
ALTER TABLE public.projects
ADD COLUMN proof_file_url text;

-- Add proof_file_url column to achievements table
ALTER TABLE public.achievements
ADD COLUMN proof_file_url text;

-- Create storage bucket for project proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-proofs', 'project-proofs', true);

-- Create storage bucket for achievement proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('achievement-proofs', 'achievement-proofs', true);

-- Create policies for project proofs
CREATE POLICY "Project proofs are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-proofs');

CREATE POLICY "Users can upload their own project proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own project proofs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for achievement proofs
CREATE POLICY "Achievement proofs are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'achievement-proofs');

CREATE POLICY "Users can upload their own achievement proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'achievement-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own achievement proofs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'achievement-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own achievement proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'achievement-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);