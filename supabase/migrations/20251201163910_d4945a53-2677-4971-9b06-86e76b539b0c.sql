alter table public.profiles add column if not exists is_public boolean default false;

create table if not exists public.advice_messages (
  id uuid not null default gen_random_uuid() primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamp with time zone not null default now(),
  read boolean default false
);

alter table public.advice_messages enable row level security;