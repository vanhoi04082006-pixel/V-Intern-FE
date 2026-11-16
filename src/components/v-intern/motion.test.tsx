import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InkCountUp } from './motion';

vi.mock('framer-motion', async (importOriginal) => ({
  ...await importOriginal<typeof import('framer-motion')>(),
  useInView: () => false,
  useReducedMotion: () => false,
}));

describe('InkCountUp business values before intersection', () => {
  it('shows the actual count when the observer has not fired', () => {
    render(<InkCountUp value={6} />);
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('keeps refreshed counts accurate outside the animation viewport', async () => {
    const view = render(<InkCountUp value={6} />);
    view.rerender(<InkCountUp value={12} />);
    await waitFor(() => expect(screen.getByText('12')).toBeInTheDocument());
  });
});
