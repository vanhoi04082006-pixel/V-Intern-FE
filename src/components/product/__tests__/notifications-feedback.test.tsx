import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Notifications } from '../outcomes';
import * as api from '@/lib/api/outcomes';

const location = vi.hoisted(() => ({ path: '/intern/notifications' }));
vi.mock('next/navigation', () => ({ usePathname: () => location.path }));
vi.mock('@/lib/api/outcomes', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/api/outcomes')>(),
  getNotifications: vi.fn(), getNotificationPreferences: vi.fn(),
  markNotification: vi.fn(), markAllNotifications: vi.fn(), setNotificationPreference: vi.fn(),
}));

const title = 'Bài nộp cần kiểm tra';
const body = 'Nhận xét theo tiêu chí và bằng chứng mã nguồn. '.repeat(7);
let read = false;
let enabled = true;
beforeEach(() => {
  vi.resetAllMocks(); read = false; enabled = true; location.path = '/intern/notifications';
  vi.mocked(api.getNotifications).mockImplementation(async (_page, unread) => ({
    items: read && unread ? [] : [{ id: 'n1', title, body, linkUrl: null, readAt: read ? '2026-10-26T01:00:00Z' : null, createdAt: '2026-10-26T00:00:00Z' }],
    page: 1, pageSize: 20, total: read && unread ? 0 : 1, totalPages: 1,
  }));
  vi.mocked(api.getNotificationPreferences).mockImplementation(async () => [{ category: 'task', enabled }]);
  vi.mocked(api.markAllNotifications).mockImplementation(async () => { read = true; return 1; });
  vi.mocked(api.markNotification).mockImplementation(async () => { read = true; return null; });
  vi.mocked(api.setNotificationPreference).mockImplementation(async (_category, value) => { enabled = value; return [{ category: 'task', enabled }]; });
});

describe('Notification feedback across roles', () => {
  it.each(['intern', 'instructor', 'admin'])('confirms the acknowledged read-all count for %s', async role => {
    location.path = `/${role}/notifications`;
    render(<Notifications />);
    await screen.findByRole('heading', { name: title });
    await userEvent.click(screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }));
    expect(await screen.findByText('Đã đánh dấu 1 thông báo là đã đọc.')).toBeVisible();
    expect(api.markAllNotifications).toHaveBeenCalledTimes(1);
  });

  it('keeps read pending, prevents a second request and only then shows success', async () => {
    let acknowledge: (value: null) => void = () => { throw new Error('Request not started'); };
    vi.mocked(api.markNotification).mockImplementation(() => new Promise(resolve => { acknowledge = resolve; }));
    render(<Notifications />);
    const button = await screen.findByRole('button', { name: `Đánh dấu đã đọc: ${title}` });
    await userEvent.dblClick(button);
    expect(button).toBeDisabled();
    expect(api.markNotification).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Đã đánh dấu thông báo là đã đọc.')).not.toBeInTheDocument();
    await act(async () => { read = true; acknowledge(null); });
    expect(await screen.findByText('Đã đánh dấu thông báo là đã đọc.')).toBeVisible();
  });

  it('reports zero updates truthfully when all notifications are already read', async () => {
    read = true;
    vi.mocked(api.markAllNotifications).mockResolvedValue(0);
    render(<Notifications />);
    await screen.findByRole('heading', { name: title });
    await userEvent.click(screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }));
    expect(await screen.findByText('Không có thông báo chưa đọc cần cập nhật.')).toBeVisible();
    expect(screen.queryByText('Đã đánh dấu 1 thông báo là đã đọc.')).not.toBeInTheDocument();
  });

  it('clears an earlier success when the next request fails', async () => {
    render(<Notifications />);
    await userEvent.click(await screen.findByRole('button', { name: `Đánh dấu đã đọc: ${title}` }));
    expect(await screen.findByText('Đã đánh dấu thông báo là đã đọc.')).toBeVisible();
    vi.mocked(api.markAllNotifications).mockRejectedValue(new Error('service unavailable'));
    await userEvent.click(screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.queryByText('Đã đánh dấu thông báo là đã đọc.')).not.toBeInTheDocument();
  });

  it('lets a keyboard user expand and collapse long content without changing read state', async () => {
    render(<Notifications />);
    const toggle = await screen.findByRole('button', { name: 'Đọc đầy đủ' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Thu gọn' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(body.trim())).toBeVisible();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Đọc đầy đủ' })).toHaveAttribute('aria-expanded', 'false');
    expect(api.markNotification).not.toHaveBeenCalled();
  });

  it('confirms a saved preference', async () => {
    render(<Notifications />);
    const checkbox = await screen.findByRole('checkbox', { name: 'Nhiệm vụ' });
    await userEvent.click(checkbox);
    expect(await screen.findByText('Đã tắt thông báo nhiệm vụ.')).toBeVisible();
    expect(api.setNotificationPreference).toHaveBeenCalledWith('task', false);
    await waitFor(() => expect(checkbox).not.toBeChecked());
  });

  it('rolls back the preference and shows an error instead of a success after rejection', async () => {
    vi.mocked(api.setNotificationPreference).mockRejectedValue(new Error('service unavailable'));
    render(<Notifications />);
    const checkbox = await screen.findByRole('checkbox', { name: 'Nhiệm vụ' });
    await userEvent.click(checkbox);
    expect(await screen.findByRole('alert')).toBeVisible();
    await waitFor(() => expect(checkbox).toBeChecked());
    expect(screen.queryByText('Đã tắt thông báo nhiệm vụ.')).not.toBeInTheDocument();
  });
});
