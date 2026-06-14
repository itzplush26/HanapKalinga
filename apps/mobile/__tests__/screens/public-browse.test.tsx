import { fireEvent, act, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../src/test-utils';
import { NurseCard } from '../../src/components/domain/NurseCard';
import { NurseFiltersSheet } from '../../src/components/nurse-filters';
import type { NurseListItem } from '../../src/lib/hooks/useNurses';

const mockNurse: NurseListItem = {
  id: '1',
  full_name: 'Maria Santos',
  city: 'Manila',
  region: 'NCR',
  specializations: ['Elderly Care', 'Post-Op Care'],
  years_experience: 5,
  hourly_rate: 250,
  daily_rate_12hr: 1500,
  verification_status: 'verified',
  provider_type: 'nurse',
  bio: 'Experienced nurse with 5 years of home care.',
};

describe('NurseCard', () => {
  it('renders all fields correctly', async () => {
    const { getByText, getByLabelText } = await renderWithProviders(
      <NurseCard nurse={mockNurse} onPress={() => {}} />
    );

    expect(getByText('Maria Santos')).toBeTruthy();
    expect(getByText('Manila')).toBeTruthy();
    expect(getByText('P1,500')).toBeTruthy();
    expect(getByText('verified')).toBeTruthy();
    expect(getByText('Elderly Care')).toBeTruthy();
    expect(getByText('Nurse')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <NurseCard nurse={mockNurse} onPress={onPress} />
    );

    fireEvent.press(getByLabelText('View profile of Maria Santos'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows Unknown when no full_name', async () => {
    const nurseNoName = { ...mockNurse, full_name: null };
    const { getByText } = await renderWithProviders(
      <NurseCard nurse={nurseNoName} onPress={() => {}} />
    );

    expect(getByText('Unknown')).toBeTruthy();
  });

  it('shows Unknown location when city is null', async () => {
    const nurseNoCity = { ...mockNurse, city: null };
    const { getByText } = await renderWithProviders(
      <NurseCard nurse={nurseNoCity} onPress={() => {}} />
    );

    expect(getByText('Unknown location')).toBeTruthy();
  });
});

describe('NurseFiltersSheet', () => {
  it('renders with current filters', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <NurseFiltersSheet
        visible={true}
        onClose={jest.fn()}
        onApply={jest.fn()}
        currentFilters={{}}
      />
    );

    expect(getByText('Filters')).toBeTruthy();
    expect(getByText('Apply')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
    expect(getByText('Manila')).toBeTruthy();
    expect(getByText('Nurse')).toBeTruthy();
    expect(getByText('Caregiver')).toBeTruthy();
  });

  it('calls onApply with selected filters', async () => {
    const onApply = jest.fn();
    const onClose = jest.fn();

    const { getByText } = await renderWithProviders(
      <NurseFiltersSheet
        visible={true}
        onClose={onClose}
        onApply={onApply}
        currentFilters={{}}
      />
    );

    fireEvent.press(getByText('Apply'));
    expect(onApply).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X is pressed', async () => {
    const onClose = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <NurseFiltersSheet
        visible={true}
        onClose={onClose}
        onApply={jest.fn()}
        currentFilters={{}}
      />
    );

    fireEvent.press(getByLabelText('Close filters'));
    expect(onClose).toHaveBeenCalled();
  });
});
