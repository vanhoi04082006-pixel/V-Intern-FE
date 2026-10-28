import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from '../outcomes';
import { getSessionUser } from '@/lib/auth/session';
import { refreshSession } from '@/lib/auth/auth-service';

const location = vi.hoisted(() => ({ path: '/intern/profile' }));
vi.mock('next/navigation', () => ({ usePathname: () => location.path }));
vi.mock('@/lib/auth/session', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/lib/auth/auth-service', () => ({ refreshSession: vi.fn() }));
const account = { id: 'qa', displayName: 'Nguyễn An', email: 'qa@example.test', roles: ['intern'], permissions: [] };
beforeEach(() => {
  vi.resetAllMocks(); location.path = '/intern/profile';
  vi.mocked(getSessionUser).mockReturnValue(account);
  vi.mocked(refreshSession).mockResolvedValue(account);
});

describe('Profile across three roles', () => {
  it.each([
    ['intern', 'Sinh viên', '/intern/github'],
    ['instructor', 'Giảng viên', '/instructor/github'],
    ['admin', 'Quản trị viên', '/admin/settings'],
  ])('provides %s account details and role-appropriate connections', (role, label, href) => {
    location.path = `/${role}/profile`;
    vi.mocked(getSessionUser).mockReturnValue({ ...account, roles: [role] });
    render(<Profile />);
    expect(screen.getByRole('heading', { level: 1, name: 'Hồ sơ' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Thông tin tài khoản' })).toHaveTextContent(label);
    expect(screen.getByRole('link', { name: /quản lý kết nối|kết nối github/i })).toHaveAttribute('href', href);
    expect(screen.getByRole('link', { name: /thông báo/i })).toHaveAttribute('href', `/${role}/notifications`);
    if (role === 'admin') expect(screen.queryByRole('link', { name: /hiệu suất/i })).not.toBeInTheDocument();
  });

  it('waits for refresh, prevents repeated requests and shows the returned identity', async () => {
    let done!: (value: typeof account) => void;
    vi.mocked(refreshSession).mockImplementation(() => new Promise(resolve => { done = resolve; }));
    render(<Profile />);
    await userEvent.dblClick(screen.getByRole('button', { name: 'Làm mới' }));
    expect(screen.getByRole('button', { name: /đang làm mới/i })).toBeDisabled();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Đã cập nhật thông tin tài khoản từ hệ thống.')).not.toBeInTheDocument();
    await act(async () => { done({ ...account, displayName: 'Nguyễn An cập nhật' }); });
    expect(await screen.findByRole('status')).toHaveTextContent('Đã cập nhật thông tin tài khoản từ hệ thống.');
    expect(screen.getByRole('region', { name: 'Thông tin tài khoản' })).toHaveTextContent('Nguyễn An cập nhật');
  });

  it('replaces success with an error after a rejected refresh and preserves the displayed data', async () => {
    render(<Profile />);
    await userEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    await screen.findByRole('status');
    vi.mocked(refreshSession).mockRejectedValue(new Error('Network unavailable'));
    await userEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.queryByText('Đã cập nhật thông tin tài khoản từ hệ thống.')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Thông tin tài khoản' })).toHaveTextContent(account.email);
  });

  it('asks for sign-in instead of claiming success after an expired session', async () => {
    vi.mocked(refreshSession).mockResolvedValue(null);
    render(<Profile />);
    await userEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  });

  it('keeps missing identity honest without suggesting a connected GitHub account', () => {
    vi.mocked(getSessionUser).mockReturnValue(null);
    render(<Profile />);
    expect(screen.getByText('Chưa có thông tin tài khoản.')).toBeVisible();
    expect(screen.queryByText(/đã kết nối/i)).not.toBeInTheDocument();
  });
});
