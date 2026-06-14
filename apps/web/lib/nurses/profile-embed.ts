/**
 * PostgREST embed for a nurse/caregiver's profile row.
 * nurses.id and nurses.verified_by both reference profiles — disambiguate with FK hint.
 *
 * Use the literal `profiles!nurses_id_fkey(...)` form directly in `.select("...")` strings.
 * Do not interpolate — Supabase client types require static select strings.
 */
