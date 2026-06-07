// Utility functions that work in both web and mobile

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(d);
}

export function getShiftLabel(shift: string): string {
  const labels: Record<string, string> = {
    morning: 'Morning (7AM - 3PM)',
    afternoon: 'Afternoon (3PM - 11PM)',
    evening: 'Evening (11PM - 7AM)',
    full_day: 'Full Day (12 hours)',
  };
  return labels[shift] || shift;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'yellow',
    accepted: 'green',
    declined: 'red',
    completed: 'blue',
    cancelled: 'gray',
    verified: 'green',
    rejected: 'red',
  };
  return colors[status] || 'gray';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
