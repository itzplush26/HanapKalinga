create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('family', 'nurse', 'admin')),
  full_name text,
  phone text,
  city text,
  barangay text,
  created_at timestamptz default now()
);

create table if not exists public.nurses (
  id uuid primary key references public.profiles(id) on delete cascade,
  prc_license_no text,
  prc_document_url text,
  nbi_document_url text,
  specializations text[],
  years_experience int,
  bio text,
  hourly_rate numeric,
  daily_rate_12hr numeric,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  rejection_reason text,
  verified_at timestamptz
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  nurse_id uuid references public.nurses(id) on delete cascade,
  date date not null,
  shift text not null check (shift in ('morning', 'afternoon', 'evening', 'full_day')),
  is_open boolean default true
);

create unique index if not exists availability_unique
  on public.availability (nurse_id, date, shift);

create table if not exists public.families (
  id uuid primary key references public.profiles(id) on delete cascade,
  patient_name text,
  patient_age int,
  patient_condition text,
  address text
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  nurse_id uuid references public.nurses(id) on delete cascade,
  requested_date date,
  shift text check (shift in ('morning', 'afternoon', 'evening', 'full_day')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references public.bookings(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  reviewee_id uuid references public.profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.nurses enable row level security;
alter table public.availability enable row level security;
alter table public.families enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

create policy "Profiles: read own" on public.profiles
  for select using (id = auth.uid());

create policy "Profiles: insert own" on public.profiles
  for insert with check (id = auth.uid());

create policy "Profiles: update own" on public.profiles
  for update using (id = auth.uid());

create policy "Profiles: admin read" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Profiles: admin update" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Nurses: public read verified" on public.nurses
  for select using (verification_status = 'verified');

create policy "Nurses: insert own" on public.nurses
  for insert with check (id = auth.uid());

create policy "Nurses: update own" on public.nurses
  for update using (id = auth.uid());

create policy "Nurses: admin manage" on public.nurses
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Availability: public read" on public.availability
  for select using (true);

create policy "Availability: nurse insert" on public.availability
  for insert with check (nurse_id = auth.uid());

create policy "Availability: nurse update" on public.availability
  for update using (nurse_id = auth.uid());

create policy "Availability: admin read" on public.availability
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Families: own access" on public.families
  for all using (id = auth.uid())
  with check (id = auth.uid());

create policy "Families: admin read" on public.families
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Bookings: read participant" on public.bookings
  for select using (
    family_id = auth.uid()
    or nurse_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Bookings: insert family" on public.bookings
  for insert with check (family_id = auth.uid());

create policy "Bookings: update participant" on public.bookings
  for update using (
    family_id = auth.uid()
    or nurse_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Messages: participant access" on public.messages
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Messages: participant insert" on public.messages
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and (b.family_id = auth.uid() or b.nurse_id = auth.uid())
    )
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Reviews: public read" on public.reviews
  for select using (true);

create policy "Reviews: family insert" on public.reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
      and b.family_id = auth.uid()
      and b.status = 'completed'
    )
  );
