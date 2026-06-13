import { getWeekRange, buildWeekSlots } from '../../src/lib/hooks/useNurseWeekAvailability';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn().mockReturnValue({ on: jest.fn().mockReturnThis(), subscribe: jest.fn() }),
    removeChannel: jest.fn(),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  },
}));

describe('useNurseWeekAvailability helpers', () => {
  it('getWeekRange returns correct Monday-Sunday range', () => {
    const wednesday = new Date('2026-06-17');
    const { start, end } = getWeekRange(wednesday);
    expect(start).toBe('2026-06-15');
    expect(end).toBe('2026-06-21');
  });

  it('getWeekRange handles month boundary', () => {
    const endOfMonth = new Date('2026-05-29');
    const { start, end } = getWeekRange(endOfMonth);
    expect(start).toBe('2026-05-25');
    expect(end).toBe('2026-05-31');
  });

  it('buildWeekSlots creates 21 slots with correct defaults', () => {
    const monday = new Date('2026-06-15');
    const slots = buildWeekSlots(monday, []);
    expect(slots).toHaveLength(21);
    expect(slots[0].date).toBe('2026-06-15');
    expect(slots[0].shift).toBe('morning');
    expect(slots[0].is_open).toBe(false);
    expect(slots[20].date).toBe('2026-06-21');
    expect(slots[20].shift).toBe('evening');
  });

  it('buildWeekSlots merges existing slots correctly', () => {
    const monday = new Date('2026-06-15');
    const existing = [
      { date: '2026-06-15', shift: 'morning' as const, is_open: true, id: 'slot-1' },
      { date: '2026-06-17', shift: 'afternoon' as const, is_open: true },
    ];
    const slots = buildWeekSlots(monday, existing);
    expect(slots.find((s) => s.date === '2026-06-15' && s.shift === 'morning')?.is_open).toBe(true);
    expect(slots.find((s) => s.date === '2026-06-15' && s.shift === 'morning')?.id).toBe('slot-1');
    expect(slots.find((s) => s.date === '2026-06-15' && s.shift === 'afternoon')?.is_open).toBe(false);
    expect(slots.find((s) => s.date === '2026-06-17' && s.shift === 'afternoon')?.is_open).toBe(true);
  });

  it('buildWeekSlots fills all 7 days from Monday to Sunday', () => {
    const monday = new Date('2026-06-15');
    const slots = buildWeekSlots(monday, []);
    const dates = [...new Set(slots.map((s) => s.date))];
    expect(dates).toEqual([
      '2026-06-15', '2026-06-16', '2026-06-17',
      '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21',
    ]);
  });

  it('buildWeekSlots has 3 shifts per day', () => {
    const monday = new Date('2026-06-15');
    const slots = buildWeekSlots(monday, []);
    const mondaySlots = slots.filter((s) => s.date === '2026-06-15');
    expect(mondaySlots).toHaveLength(3);
    expect(mondaySlots.map((s) => s.shift).sort()).toEqual(['afternoon', 'evening', 'morning']);
  });
});
