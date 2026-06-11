import type {
  Profile,
  BookingStatus,
  VerificationStatus,
  Shift,
} from '@hanapkalinga/shared/types';

export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getShiftLabel(shift: Shift): string {
  const labels: Record<Shift, string> = {
    morning: 'Morning (6AM-2PM)',
    afternoon: 'Afternoon (2PM-10PM)',
    evening: 'Evening (10PM-6AM)',
    full_day: 'Full Day (6AM-6PM)',
  };
  return labels[shift] || shift;
}

export function formatRate(rate: number): string {
  return `P${rate.toLocaleString('en-PH')}`;
}

export function getStatusColor(
  status: BookingStatus | VerificationStatus
): 'success' | 'pending' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'pending' | 'error' | 'info' | 'neutral'> = {
    pending: 'pending',
    accepted: 'success',
    declined: 'error',
    completed: 'info',
    cancelled: 'neutral',
    under_review: 'info',
    verified: 'success',
    rejected: 'error',
    resubmission_required: 'pending',
  };
  return map[status] || 'neutral';
}

export function buildProfileName(profile: Pick<Profile, 'full_name' | 'first_name' | 'last_name'>): string {
  if (profile.full_name) return profile.full_name;
  if (profile.first_name && profile.last_name) return `${profile.first_name} ${profile.last_name}`;
  if (profile.first_name) return profile.first_name;
  if (profile.last_name) return profile.last_name;
  return 'Unknown';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
