import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../src/components/ui/Button';

describe('Button', () => {
  it('renders correctly with default variant', async () => {
    const { getByText, getByRole } = await render(
      <Button onPress={() => {}}>Press me</Button>
    );
    expect(getByText('Press me')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  it('renders all variants without error', async () => {
    const variants = ['primary', 'secondary', 'ghost', 'link'] as const;
    for (const variant of variants) {
      const { getByText } = await render(
        <Button variant={variant} onPress={() => {}}>
          {variant}
        </Button>
      );
      expect(getByText(variant)).toBeTruthy();
    }
  });

  it('shows loading spinner when loading is true', async () => {
    const { queryByText, getByRole } = await render(
      <Button loading onPress={() => {}}>
        Submit
      </Button>
    );
    expect(queryByText('Submit')).toBeNull();
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button onPress={onPress}>Press me</Button>
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button disabled onPress={onPress}>
        Disabled
      </Button>
    );
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
