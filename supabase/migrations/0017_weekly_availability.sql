-- Weekly recurring availability pattern and date-specific exceptions.

create table if not exists nurse_weekly_availability (
  nurse_id uuid not null references nurses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  shift text not null check (shift in ('morning', 'afternoon', 'evening', 'full_day')),
  is_open boolean not null default false,
  primary key (nurse_id, day_of_week, shift)
);

create table if not exists availability_date_exceptions (
  nurse_id uuid not null references nurses(id) on delete cascade,
  date date not null,
  is_open boolean not null,
  primary key (nurse_id, date)
);

alter table nurse_weekly_availability enable row level security;
alter table availability_date_exceptions enable row level security;

create policy "Weekly availability: nurse read own"
on nurse_weekly_availability for select
using (nurse_id = auth.uid());

create policy "Weekly availability: nurse insert own"
on nurse_weekly_availability for insert
with check (nurse_id = auth.uid());

create policy "Weekly availability: nurse update own"
on nurse_weekly_availability for update
using (nurse_id = auth.uid());

create policy "Weekly availability: nurse delete own"
on nurse_weekly_availability for delete
using (nurse_id = auth.uid());

create policy "Weekly availability: public read"
on nurse_weekly_availability for select
using (true);

create policy "Date exceptions: nurse read own"
on availability_date_exceptions for select
using (nurse_id = auth.uid());

create policy "Date exceptions: nurse insert own"
on availability_date_exceptions for insert
with check (nurse_id = auth.uid());

create policy "Date exceptions: nurse update own"
on availability_date_exceptions for update
using (nurse_id = auth.uid());

create policy "Date exceptions: nurse delete own"
on availability_date_exceptions for delete
using (nurse_id = auth.uid());

create policy "Date exceptions: public read"
on availability_date_exceptions for select
using (true);
