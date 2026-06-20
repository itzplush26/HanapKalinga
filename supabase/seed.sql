-- Admin account seed (idempotent). Run in Supabase SQL Editor after migrations.
-- Credentials: admin@hanapkalinga.ph / ChangeMe123!
do $$
declare
  admin_id uuid;
  instance uuid;
begin
  select id into instance from auth.instances limit 1;
  if instance is null then
    raise exception 'auth.instances is empty — cannot seed admin user.';
  end if;

  select id into admin_id from auth.users where email = 'admin@hanapkalinga.com';

  if admin_id is null then
    admin_id := gen_random_uuid();

    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    values (
      admin_id,
      instance,
      'authenticated',
      'authenticated',
      'admin@hanapkalinga.com',
      crypt('ChangeMe123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    );
  end if;

  if not exists (
    select 1 from auth.identities
    where user_id = admin_id and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      admin_id,
      jsonb_build_object(
        'sub', admin_id::text,
        'email', 'admin@hanapkalinga.ph',
        'email_verified', true
      ),
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    );
  end if;

  insert into public.profiles (id, role, full_name, city)
  values (admin_id, 'admin', 'HanapKalinga Admin', 'Metro Manila')
  on conflict (id) do nothing;
end $$;
