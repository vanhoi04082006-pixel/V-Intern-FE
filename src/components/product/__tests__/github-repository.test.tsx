import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GithubRepositoryAdmin, SessionRepositoryCard } from '../github-connection';
import { configureGithubWebhook, provisionRepository, selectRepositoryAccount, repositoryAccountStatus } from '@/lib/api/github';
vi.mock('@/lib/api/github', () => ({
  githubStatus: vi.fn(async () => ({ configured: true, connected: true, login: 'platform-owner', reconnectRequired: false, canCreatePublicRepo: true })), connectGithub: vi.fn(), disconnectGithub: vi.fn(),
  repositoryAccountStatus: vi.fn(async () => ({ configured: true, connected: true, login: 'platform-owner', ready: true })),
  selectRepositoryAccount: vi.fn(async () => ({ configured: true, connected: true, login: 'platform-owner', ready: true })),
  sessionRepository: vi.fn(async () => ({ repository: { owner: 'teacher', name: 'learning', url: 'https://github.com/teacher/learning', status: 'ready', errorCode: null, webhookStatus: 'ready' }, members: [] })),
  provisionRepository: vi.fn(), inviteRepositoryMembers: vi.fn(), configureGithubWebhook: vi.fn(async () => ({})),
  githubRepositoryActivity: vi.fn(async () => ({ items: [{ id: 'e1', eventType: 'pull_request', action: 'synchronize', pullNumber: 3, headSha: 'a'.repeat(40), branch: null, receivedAt: '2026-10-15T01:00:00Z' }], total: 1 })),
}));
describe('repository webhook status', () => {
  it('lets Admin select the linked central account and reloads its verified status', async () => {
    vi.mocked(repositoryAccountStatus).mockClear();
    render(<GithubRepositoryAdmin />);
    fireEvent.click(await screen.findByRole('button', { name: 'Dùng GitHub đã liên kết của tôi làm tài khoản chung' }));
    await waitFor(() => expect(selectRepositoryAccount).toHaveBeenCalled());
    await waitFor(() => expect(repositoryAccountStatus).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/Tài khoản đã chọn: @platform-owner/)).toBeInTheDocument();
    expect(screen.getByText(/Admin cấp quyền tạo và quản lý repo public/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/mật khẩu/i)).not.toBeInTheDocument();
  });
  it('shows a selection failure without claiming a new configuration', async () => {
    vi.mocked(selectRepositoryAccount).mockRejectedValueOnce(new Error('Permission denied'));
    render(<GithubRepositoryAdmin />);
    fireEvent.click(await screen.findByRole('button', { name: 'Dùng GitHub đã liên kết của tôi làm tài khoản chung' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
  it('shows scoped PR activity and never exposes configuration actions to a student', async () => {
    render(<SessionRepositoryCard sessionId="s1" />);
    expect(await screen.findByText('Webhook đang đồng bộ')).toBeInTheDocument();
    expect(await screen.findByText(/PR #3/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cập nhật webhook' })).not.toBeInTheDocument();
    expect(provisionRepository).not.toHaveBeenCalled();
  });
  it('lets the managing teacher retry only webhook setup', async () => {
    render(<SessionRepositoryCard sessionId="s1" manage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cập nhật webhook' }));
    await waitFor(() => expect(configureGithubWebhook).toHaveBeenCalledWith('s1'));
    expect(provisionRepository).not.toHaveBeenCalled();
  });
});
