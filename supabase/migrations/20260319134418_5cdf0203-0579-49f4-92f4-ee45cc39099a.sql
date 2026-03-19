ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category text DEFAULT 'Coding';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image_url text;