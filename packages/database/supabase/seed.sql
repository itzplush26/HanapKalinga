with admin_user as (
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
    gen_random_uuid(),
    (select id from auth.instances limit 1),
    'authenticated',
    'authenticated',
    'admin@hanapkalinga.ph',
    crypt('ChangeMe123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  )
  returning id
)
insert into public.profiles (id, role, full_name, city)
select id, 'admin', 'HanapKalinga Admin', 'Metro Manila' from admin_user;
