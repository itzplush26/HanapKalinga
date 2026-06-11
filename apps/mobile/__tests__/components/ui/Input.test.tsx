import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Input } from '../../../src/components/ui/Input';

describe('Input', () => {
  it('renders with label and placeholder', async () => {
    const { getByText, getByPlaceholderText } = await render(
      <Input label="Email" placeholder="Enter your email" />
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
  });

  it('shows error state', async () => {
    const { getByText } = await render(
      <Input label="Email" error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('handles text input', async () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = await render(
      <Input placeholder="Enter text" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Enter text'), 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('shows secure text entry toggle', async () => {
    const { getByLabelText } = await render(
      <Input secureTextEntry label="Password" />
    );
    expect(getByLabelText('Show password')).toBeTruthy();
  });
});
