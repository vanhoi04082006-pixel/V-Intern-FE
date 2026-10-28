import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, expect, it, vi } from 'vitest';
import { ApiError, errorMessage } from '@/lib/auth/api-client';
import { RecruitmentRounds } from './recruitment-rounds';

const api = vi.hoisted(() => ({ listRecruitmentRounds: vi.fn(), roundDetail: vi.fn(), roundStatus: vi.fn() }));
vi.mock('@/lib/api/applications', async () => ({ ...(await vi.importActual('@/lib/api/applications')), ...api }));
vi.mock('@/lib/api/career-roles', () => ({ listRecruitingCareers: vi.fn().mockResolvedValue([]) }));
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() { this.setAttribute('open', ''); } },
    close: { configurable: true, value() { this.removeAttribute('open'); } },
  });
});

it('starts a new slot form without carrying over the failed round-opening message', async () => {
  const round = { id: 'round', name: 'QA', status: 'draft', opensAt: '2026-10-28T01:00:00Z', closesAt: '2026-11-01T01:00:00Z', slots: [] };
  api.listRecruitmentRounds.mockResolvedValue([round]);
  api.roundDetail.mockResolvedValue(round);
  const error = new ApiError(400, 'RECRUITMENT_ROUND_SLOT_REQUIRED', 'internal');
  api.roundStatus.mockRejectedValue(error);
  render(<RecruitmentRounds />);
  fireEvent.change(await screen.findByRole('combobox', { name: 'Đợt tuyển' }), { target: { value: 'round' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Mở nhận CV' }));
  expect(await screen.findByText(errorMessage(error))).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Thêm khung giờ' }));
  const dialog = screen.getByRole('dialog', { name: 'Mở khung phỏng vấn' });
  expect(within(dialog).queryByText(errorMessage(error))).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Mở khung giờ' })).toBeEnabled();
});
