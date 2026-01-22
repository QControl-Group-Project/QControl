This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



-- =============================================================================
-- COMPLETE HOSPITAL QUEUE & APPOINTMENT MANAGEMENT SCHEMA
-- =============================================================================
-- Features:
-- 1. Queue tokens (authenticated & unauthenticated users)
-- 2. Appointment booking system
-- 3. Doctor schedules and availability
-- 4. Hospital, department, and staff management
-- =============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin','doctor','staff','patient');
  end if;
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('scheduled','confirmed','waiting','in-progress','completed','cancelled','no-show');
  end if;
  if not exists (select 1 from pg_type where typname = 'appointment_type') then
    create type public.appointment_type as enum ('consultation','follow-up','emergency','checkup');
  end if;
  if not exists (select 1 from pg_type where typname = 'gender') then
    create type public.gender as enum ('male','female','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending','accepted','expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'queue_token_status') then
    create type public.queue_token_status as enum ('waiting','called','serving','served','skipped','cancelled');
  end if;
end $$;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- User Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role public.user_role default 'patient',
  phone text,
  avatar_url text,
  date_of_birth date,
  address text,
  gender public.gender,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Hospitals
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) not null,
  name text not null,
  description text,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  logo_url text,
  website text,
  opening_time text,
  closing_time text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  name text not null,
  description text,
  floor_number int,
  contact_number text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (hospital_id, name)
);

-- Specializations
create table if not exists public.specializations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  created_at timestamptz default now()
);

-- =============================================================================
-- DOCTOR TABLES
-- =============================================================================

-- Doctors
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references auth.users(id) on delete cascade not null,
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  department_id uuid references public.departments(id) on delete set null,
  specialization_id uuid references public.specializations(id) on delete set null,
  license_number text unique,
  qualification text,
  experience_years int,
  consultation_fee numeric(10,2),
  bio text,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Doctor Schedules (weekly recurring)
create table if not exists public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  start_time time not null,
  end_time time not null,
  slot_duration int not null default 15, -- minutes per slot
  max_patients_per_slot int not null default 1,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (doctor_id, day_of_week, start_time, end_time)
);

-- Doctor Leaves/Unavailability
create table if not exists public.doctor_leaves (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  leave_date date not null,
  start_time time,
  end_time time,
  reason text,
  is_full_day boolean default false,
  created_at timestamptz default now()
);

-- =============================================================================
-- APPOINTMENT TABLE
-- =============================================================================

-- Appointments (supports authenticated & unauthenticated patients)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  patient_id uuid references auth.users(id) on delete set null, -- NULL if unauthenticated
  appointment_number int not null,
  
  -- Patient info (required even if authenticated)
  patient_name text not null,
  patient_phone text,
  patient_email text,
  patient_age int,
  patient_gender public.gender,
  
  -- Appointment details
  appointment_date date not null,
  appointment_time time not null,
  status public.appointment_status not null default 'scheduled',
  appointment_type public.appointment_type not null default 'consultation',
  
  -- Medical info
  symptoms text,
  notes text,
  prescription text,
  diagnosis text,
  
  -- Timestamps
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  
  -- Ensure unique appointment per doctor/date/time
  unique (doctor_id, appointment_date, appointment_time)
);

-- =============================================================================
-- QUEUE MANAGEMENT TABLES
-- =============================================================================

-- Queues
create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  description text,
  max_tokens_per_day int not null default 100,
  estimated_wait_time int not null default 15, -- minutes
  opening_time text,
  closing_time text,
  is_active boolean default true,
  qr_code_url text,
  current_token_number int not null default 0,
  created_at timestamptz default now()
);

-- Queue Tokens (supports authenticated & unauthenticated users)
create table if not exists public.queue_tokens (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references public.queues(id) on delete cascade not null,
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  token_number int not null,
  
  -- Patient info (patient_id is NULL for unauthenticated users)
  patient_id uuid references auth.users(id) on delete set null,
  patient_name text not null,
  patient_phone text,
  patient_age int,
  
  purpose text,
  priority int not null default 0, -- Higher = more priority
  status public.queue_token_status not null default 'waiting',
  
  -- Timestamps for tracking
  created_at timestamptz default now(),
  called_at timestamptz,
  serving_started_at timestamptz,
  completed_at timestamptz,
  
  -- Daily token numbers are unique per queue
  unique (queue_id, token_number, created_at)
);

-- =============================================================================
-- STAFF MANAGEMENT TABLES
-- =============================================================================

-- Staff Assignments to Hospitals
create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references auth.users(id) on delete cascade not null,
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  department_id uuid references public.departments(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  role text default 'staff',
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (staff_id, hospital_id)
);

-- Staff Assignments to Queues
create table if not exists public.queue_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references auth.users(id) on delete cascade not null,
  queue_id uuid references public.queues(id) on delete cascade not null,
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  assigned_by uuid references auth.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (staff_id, queue_id)
);

-- Invitations for staff/doctors
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade not null,
  email text not null,
  role public.user_role not null default 'staff',
  invited_by uuid references auth.users(id) on delete set null,
  token text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

create index if not exists idx_queue_tokens_queue_date 
  on public.queue_tokens(queue_id, created_at);
  
create index if not exists idx_queue_tokens_patient 
  on public.queue_tokens(patient_id) where patient_id is not null;
  
create index if not exists idx_queue_tokens_status 
  on public.queue_tokens(status, queue_id);

create index if not exists idx_appointments_doctor_date 
  on public.appointments(doctor_id, appointment_date);
  
create index if not exists idx_appointments_patient 
  on public.appointments(patient_id) where patient_id is not null;
  
create index if not exists idx_appointments_hospital_date 
  on public.appointments(hospital_id, appointment_date);

create index if not exists idx_staff_assignments_hospital 
  on public.staff_assignments(hospital_id);
  
create index if not exists idx_staff_assignments_staff 
  on public.staff_assignments(staff_id);

create index if not exists idx_doctors_hospital 
  on public.doctors(hospital_id);

-- =============================================================================
-- AUTH TRIGGER (Auto-create profile on user signup)
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'patient')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name),
        role = coalesce(excluded.role, profiles.role),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RPC FUNCTIONS FOR QUEUE MANAGEMENT
-- =============================================================================

-- Get next token number for a queue (resets daily)
create or replace function public.get_next_queue_token_number(p_queue_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num integer;
begin
  select coalesce(max(token_number), 0) + 1
    into next_num
  from public.queue_tokens
  where queue_id = p_queue_id
    and created_at::date = current_date;

  update public.queues
    set current_token_number = next_num
  where id = p_queue_id;

  return next_num;
end;
$$;

-- Get position in queue for a token
create or replace function public.get_token_position(p_token_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  with target as (
    select queue_id, token_number, created_at::date as day
    from public.queue_tokens
    where id = p_token_id
  )
  select count(*)::integer from public.queue_tokens qt
  join target t on t.queue_id = qt.queue_id
  where qt.created_at::date = t.day
    and qt.token_number < t.token_number
    and qt.status in ('waiting','called','serving');
$$;

-- Calculate estimated wait time
create or replace function public.calculate_estimated_wait(p_queue_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(q.estimated_wait_time, 0) *
         greatest(
           (select count(*)::integer from public.queue_tokens qt
             where qt.queue_id = p_queue_id
               and qt.created_at::date = current_date
               and qt.status in ('waiting','called','serving')),
           0
         ) as estimated_minutes
  from public.queues q
  where q.id = p_queue_id;
$$;

-- Get queue statistics
create or replace function public.get_queue_stats(p_queue_id uuid)
returns table(
  waiting bigint,
  called bigint,
  serving bigint,
  served bigint,
  skipped bigint,
  cancelled bigint,
  average_wait_time numeric,
  total bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where status = 'waiting')   as waiting,
    count(*) filter (where status = 'called')    as called,
    count(*) filter (where status = 'serving')   as serving,
    count(*) filter (where status = 'served')    as served,
    count(*) filter (where status = 'skipped')   as skipped,
    count(*) filter (where status = 'cancelled') as cancelled,
    avg(extract(epoch from coalesce(completed_at, now()) - created_at) / 60)
      filter (where status = 'served')           as average_wait_time,
    count(*)                                     as total
  from public.queue_tokens
  where queue_id = p_queue_id
    and created_at::date = current_date;
$$;

-- =============================================================================
-- RPC FUNCTIONS FOR APPOINTMENT MANAGEMENT
-- =============================================================================

-- Check if doctor is available for appointment
create or replace function public.check_doctor_availability(
  p_doctor_id uuid,
  p_appointment_date date,
  p_appointment_time time
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if doctor is on leave
  if exists (
    select 1 from public.doctor_leaves dl
    where dl.doctor_id = p_doctor_id
      and dl.leave_date = p_appointment_date
      and (dl.is_full_day or 
           (p_appointment_time between coalesce(dl.start_time, p_appointment_time) 
                                   and coalesce(dl.end_time, p_appointment_time)))
  ) then
    return false;
  end if;

  -- Check if time falls within doctor's schedule
  if not exists (
    select 1 from public.doctor_schedules ds
    where ds.doctor_id = p_doctor_id
      and ds.day_of_week = extract(dow from p_appointment_date)
      and p_appointment_time between ds.start_time and ds.end_time
      and ds.is_active = true
  ) then
    return false;
  end if;

  -- Check if slot is already booked
  if exists (
    select 1 from public.appointments a
    where a.doctor_id = p_doctor_id
      and a.appointment_date = p_appointment_date
      and a.appointment_time = p_appointment_time
      and a.status in ('scheduled','confirmed','waiting','in-progress')
  ) then
    return false;
  end if;

  return true;
end;
$$;

-- Get next appointment number for a doctor on a specific date
create or replace function public.get_next_appointment_number(
  p_doctor_id uuid,
  p_appointment_date date
)
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(max(appointment_number), 0) + 1
  from public.appointments
  where doctor_id = p_doctor_id
    and appointment_date = p_appointment_date;
$$;

-- Get appointment statistics for a hospital
create or replace function public.get_appointment_stats(
  p_hospital_id uuid,
  p_start_date date,
  p_end_date date
)
returns table(
  total bigint,
  scheduled bigint,
  confirmed bigint,
  waiting bigint,
  in_progress bigint,
  completed bigint,
  cancelled bigint,
  no_show bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*)                                        as total,
    count(*) filter (where status = 'scheduled')    as scheduled,
    count(*) filter (where status = 'confirmed')    as confirmed,
    count(*) filter (where status = 'waiting')      as waiting,
    count(*) filter (where status = 'in-progress')  as in_progress,
    count(*) filter (where status = 'completed')    as completed,
    count(*) filter (where status = 'cancelled')    as cancelled,
    count(*) filter (where status = 'no-show')      as no_show
  from public.appointments
  where hospital_id = p_hospital_id
    and appointment_date between p_start_date and p_end_date;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Helper function to enable RLS with permissive policies
create or replace function public.enable_rls_and_policy(tbl text) 
returns void
language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', tbl);
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' 
      and tablename=tbl 
      and policyname=tbl||'_all'
  ) then
    execute format(
      'create policy %I_all on public.%I for all using (true) with check (true)', 
      tbl, tbl
    );
  end if;
end;
$$;

-- Enable RLS on all tables
select public.enable_rls_and_policy('profiles');
select public.enable_rls_and_policy('hospitals');
select public.enable_rls_and_policy('departments');
select public.enable_rls_and_policy('specializations');
select public.enable_rls_and_policy('doctors');
select public.enable_rls_and_policy('doctor_schedules');
select public.enable_rls_and_policy('doctor_leaves');
select public.enable_rls_and_policy('appointments');
select public.enable_rls_and_policy('staff_assignments');
select public.enable_rls_and_policy('queue_staff_assignments');
select public.enable_rls_and_policy('invitations');
select public.enable_rls_and_policy('queues');
select public.enable_rls_and_policy('queue_tokens');

-- =============================================================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Uncomment to insert sample specializations
/*
insert into public.specializations (name, description, icon) values
  ('General Medicine', 'General medical consultation', '🩺'),
  ('Cardiology', 'Heart and cardiovascular system', '❤️'),
  ('Pediatrics', 'Medical care for children', '👶'),
  ('Orthopedics', 'Bones, joints, and muscles', '🦴'),
  ('Dermatology', 'Skin, hair, and nails', '🧴')
on conflict (name) do nothing;
*/