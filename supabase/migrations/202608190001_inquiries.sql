create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null check (inquiry_type in ('quote', 'want-to-buy', 'want-to-sell')),
  status text not null default 'received',
  name text not null,
  company text not null,
  email text not null,
  phone text,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.inquiry_files (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  original_name text not null,
  storage_path text not null unique,
  content_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiry_files_inquiry_id_idx on public.inquiry_files (inquiry_id);
alter table public.inquiries enable row level security;
alter table public.inquiry_files enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inquiry-files', 'inquiry-files', false, 10485760, array[
  'application/pdf', 'text/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png'
])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
