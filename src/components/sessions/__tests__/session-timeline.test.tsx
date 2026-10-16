import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SessionTimeline } from '../session-timeline';
it('loads and paginates real scoped events without inventing an empty history', async () => {
  const load = vi.fn(async (_id: string, page: number) => ({ items: [{ id: `e${page}`, action: 'task.completed', summary: `Hoạt động ${page}`, actorName: 'Lan', createdAt: '2026-10-01' }], total: 11, page, pageSize: 10, totalPages: 2 }));
  render(<SessionTimeline sessionId="s1" load={load} />);
  expect(await screen.findByText('Hoạt động 1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
  expect(await screen.findByText('Hoạt động 2')).toBeInTheDocument();
  await waitFor(() => expect(load).toHaveBeenLastCalledWith('s1', 2, expect.any(AbortSignal)));
});
