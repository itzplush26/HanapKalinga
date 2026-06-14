import { renderWithProviders } from '../../../src/test-utils';
import { Skeleton } from '../../../src/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders text variant by default', async () => {
    const { getByTestId } = await renderWithProviders(
      <Skeleton testID="skeleton" />
    );
    expect(getByTestId('skeleton')).toBeTruthy();
  });

  it('renders all variants without error', async () => {
    const variants = ['text', 'circle', 'rectangle'] as const;
    for (const variant of variants) {
      const { getByTestId } = await renderWithProviders(
        <Skeleton testID={`skeleton-${variant}`} variant={variant} />
      );
      expect(getByTestId(`skeleton-${variant}`)).toBeTruthy();
    }
  });

  it('applies custom dimensions', async () => {
    const { getByTestId } = await renderWithProviders(
      <Skeleton testID="skeleton" width={100} height={50} />
    );
    const element = getByTestId('skeleton');
    expect(element.props.style.width).toBe(100);
    expect(element.props.style.height).toBe(50);
  });
});
