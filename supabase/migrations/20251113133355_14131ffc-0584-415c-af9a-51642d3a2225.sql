-- Add collaboration_open column to projects table
ALTER TABLE public.projects 
ADD COLUMN collaboration_open boolean DEFAULT false;

-- Update existing projects to be not open for collaboration by default
UPDATE public.projects 
SET collaboration_open = false 
WHERE collaboration_open IS NULL;