import {
  formatDate,
  getShiftLabel,
  formatRate,
  getStatusColor,
  buildProfileName,
  getInitials,
  cn,
} from '../../src/lib/helpers';

describe('formatDate', () => {
  it('formats date as "Mon, Jun 15"', () => {
    const result = formatDate('2026-06-15T12:00:00Z');
    expect(result).toMatch(/\w{3,},\s\w{3,}\s\d{1,2}/);
  });
});

describe('getShiftLabel', () => {
  it('returns correct label for each shift', () => {
    expect(getShiftLabel('morning')).toContain('6AM');
    expect(getShiftLabel('afternoon')).toContain('2PM');
    expect(getShiftLabel('evening')).toContain('10PM');
    expect(getShiftLabel('full_day')).toContain('6AM');
  });

  it('returns the input for unknown shift', () => {
    expect(getShiftLabel('unknown' as any)).toBe('unknown');
  });
});

describe('formatRate', () => {
  it('formats rate with peso sign', () => {
    const result = formatRate(1500);
    expect(result).toMatch(/^P/);
    expect(result).toContain('1,500');
  });
});

describe('getStatusColor', () => {
  it('maps booking statuses to badge colors', () => {
    expect(getStatusColor('pending')).toBe('pending');
    expect(getStatusColor('accepted')).toBe('success');
    expect(getStatusColor('declined')).toBe('error');
    expect(getStatusColor('completed')).toBe('info');
    expect(getStatusColor('cancelled')).toBe('neutral');
  });

  it('maps verification statuses to badge colors', () => {
    expect(getStatusColor('verified')).toBe('success');
    expect(getStatusColor('rejected')).toBe('error');
    expect(getStatusColor('under_review')).toBe('info');
    expect(getStatusColor('resubmission_required')).toBe('pending');
  });
});

describe('buildProfileName', () => {
  it('uses full_name when available', () => {
    expect(buildProfileName({ full_name: 'Juan Dela Cruz', first_name: 'Juan', last_name: 'Cruz' })).toBe('Juan Dela Cruz');
  });

  it('combines first and last names', () => {
    expect(buildProfileName({ full_name: null, first_name: 'Maria', last_name: 'Santos' })).toBe('Maria Santos');
  });

  it('falls back to first name only', () => {
    expect(buildProfileName({ full_name: null, first_name: 'Jose', last_name: null })).toBe('Jose');
  });

  it('returns Unknown when no name available', () => {
    expect(buildProfileName({ full_name: null, first_name: null, last_name: null })).toBe('Unknown');
  });
});

describe('getInitials', () => {
  it('returns first two initials from full name', () => {
    expect(getInitials('Juan Dela Cruz')).toBe('JD');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Juan')).toBe('J');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('maria santos')).toBe('MS');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});
