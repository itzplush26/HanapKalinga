import { render } from '@testing-library/react-native';
import { Badge } from '../../../src/components/ui/Badge';

describe('Badge', () => {
  it('renders label correctly', async () => {
    const { getByText } = await render(<Badge label="Active" />);
    expect(getByText('Active')).toBeTruthy();
  });

  it('renders all color variants without error', async () => {
    const colors = ['success', 'pending', 'error', 'info', 'neutral'] as const;
    for (const color of colors) {
      const { getByText } = await render(
        <Badge color={color} label={color} />
      );
      expect(getByText(color)).toBeTruthy();
    }
  });
});
