import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionRepositoryCard } from '../github-connection';
import { configureGithubWebhook, provisionRepository } from '@/lib/api/github';
vi.mock('@/lib/api/github', () => ({
  githubStatus: vi.fn(), connectGithub: vi.fn(), disconnectGithub: vi.fn(),
  sessionRepository: vi.fn(async () => ({ repository: { owner: 'teacher', name: 'learning', url: 'https://github.com/teacher/learning', status: 'ready', errorCode: null, webhookStatus: 'ready' }, members: [] })),
  provisionRepository: vi.fn(), inviteRepositoryMembers: vi.fn(), configureGithubWebhook: vi.fn(async () => ({})),
  githubRepositoryActivity: vi.fn(async () => ({ items: [{ id: 'e1', eventType: 'pull_request', action: 'synchronize', pullNumber: 3, headSha: 'a'.repeat(40), branch: null, receivedAt: '2026-10-15T01:00:00Z' }], total: 1 })),
}));
describe('repository webhook status', () => {
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
