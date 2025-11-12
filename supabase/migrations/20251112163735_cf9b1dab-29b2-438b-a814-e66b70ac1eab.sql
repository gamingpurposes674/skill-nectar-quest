-- Add age and dream_college to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS dream_college text;

-- Create enum for validation status if not exists
DO $$ BEGIN
  CREATE TYPE public.validation_status AS ENUM ('approved', 'rejected', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add validation_status to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS validation_status validation_status DEFAULT 'approved';

-- Add validation_status to achievements table
ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS validation_status validation_status DEFAULT 'approved';