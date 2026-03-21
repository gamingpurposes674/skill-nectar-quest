CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  styles text[] := ARRAY['avataaars', 'bottts', 'fun-emoji'];
  seeds text[] := ARRAY['Felix', 'Aneka', 'Liam', 'Sophia', 'Milo', 'Zara', 'Oliver', 'Chloe', 'Jasper', 'Luna', 'Kai', 'Nova', 'Aria', 'Leo', 'Maya', 'Finn', 'Sage', 'River'];
  random_style text;
  random_seed text;
  random_avatar text;
BEGIN
  random_style := styles[1 + floor(random() * array_length(styles, 1))::int];
  random_seed := seeds[1 + floor(random() * array_length(seeds, 1))::int];
  random_avatar := 'https://api.dicebear.com/7.x/' || random_style || '/svg?seed=' || random_seed;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', random_avatar)
  );
  RETURN NEW;
END;
$function$;