import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { Communications } from '../communications';
const api = vi.hoisted(() => ({ listMail: vi.fn(), previewMail: vi.fn(), resendMail: vi.fn() }));
vi.mock('@/lib/api/communications', () => api);
beforeEach(() => { vi.clearAllMocks(); api.listMail.mockResolvedValue({ items: [{ id: 'one', kind: 'schedule', recipientHint: 'a***@vintern.test', status: 'uncertain', attempts: 1, availableAt: '2026-10-24T12:00:00Z', expiresAt: '2026-10-25T12:00:00Z', lastCode: 'SMTP_ACCEPTANCE_UNKNOWN', createdAt: '2026-10-24T12:00:00Z' }], total: 1, page: 1, pageSize: 25, transportConfigured: false }); });
it('explains uncertain delivery, requires acknowledgement, blocks double click and surfaces server failure', async () => {
  let reject!: (reason: Error) => void; api.resendMail.mockReturnValue(new Promise((_, fail) => { reject = fail; }));
  render(<Communications />); await screen.findByText('a***@vintern.test');
  expect(screen.getByText(/SMTP chưa được cấu hình/)).toBeInTheDocument();
  const resend = screen.getByRole('button', { name: 'Gửi lại' }); expect(resend).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /chấp nhận nguy cơ gửi trùng/ })); fireEvent.click(resend); fireEvent.click(resend);
  expect(api.resendMail).toHaveBeenCalledTimes(1); expect(api.resendMail).toHaveBeenCalledWith('one', true);
  reject(Error('Fixture failure')); await waitFor(() => expect(resend).not.toBeDisabled()); expect(screen.getByRole('alert')).toBeInTheDocument();
});
it('renders sensitive preview as redacted text without injecting server HTML', async () => {
  api.previewMail.mockResolvedValue({ redacted: true, message: 'Nội dung được bảo vệ.' });
  render(<Communications />); await screen.findByText('a***@vintern.test'); fireEvent.click(screen.getByRole('button', { name: 'Xem nội dung' }));
  expect(await screen.findByText('Nội dung được bảo vệ.')).toBeInTheDocument();
});
