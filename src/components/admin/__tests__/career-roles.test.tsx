import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { CareerRoles } from '../career-roles';
import { ApiError } from '@/lib/auth/api-client';
const api = vi.hoisted(() => ({ listCareerRoles: vi.fn(), createCareerRole: vi.fn(), updateCareerRole: vi.fn(), archiveCareerRole: vi.fn(), listCareerRoleRevisions: vi.fn() }));
vi.mock('@/lib/api/career-roles', async () => ({ ...await vi.importActual('@/lib/api/career-roles'), ...api }));
const role = { code: 'data_analyst', name: 'Data Analyst', description: 'Phân tích dữ liệu và giải thích kết quả bằng bằng chứng.', level: 'intern' as const, language: 'vi' as const, requiredSkills: ['SQL'], optionalSkills: ['Python'], competencyWeights: { SQL: 100 }, status: 'published' as const, acceptingApplications: true, version: 3, createdAt: '2026-10-23T00:00:00Z', updatedAt: '2026-10-23T00:00:00Z' };
const page = (items = [role]) => ({ items, total: items.length, page: 1, pageSize: 25 });
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
beforeEach(() => { vi.clearAllMocks(); api.listCareerRoles.mockResolvedValue(page()); api.listCareerRoleRevisions.mockResolvedValue({ items: [{ version: 3, snapshot: role, createdBy: null, createdAt: role.createdAt }], total: 1, page: 1, pageSize: 25 }); });

it('creates an extensible career as a draft without changing account roles', async () => {
  api.createCareerRole.mockResolvedValue({ ...role, code: 'mobile', name: 'Mobile Developer', status: 'draft', acceptingApplications: false, version: 1 });
  render(<CareerRoles />);
  await screen.findByText('Data Analyst');
  fireEvent.click(screen.getByRole('button', { name: 'Thêm nghề nghiệp' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Mã nghề nghiệp'), { target: { value: 'mobile' } });
  fireEvent.change(within(dialog).getByLabelText('Tên nghề nghiệp'), { target: { value: 'Mobile Developer' } });
  fireEvent.change(within(dialog).getByLabelText('Mô tả'), { target: { value: 'Xây dựng ứng dụng di động nhỏ và kiểm thử.' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo bản nháp' }));
  await waitFor(() => expect(api.createCareerRole).toHaveBeenCalledWith(expect.objectContaining({ code: 'mobile', name: 'Mobile Developer', requiredSkills: [], competencyWeights: {} })));
  expect(await screen.findByRole('status')).toHaveTextContent('Đã tạo bản nháp');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('edits with the server version and retains a failed draft on conflict', async () => {
  api.updateCareerRole.mockRejectedValue(new ApiError(409, 'CAREER_ROLE_VERSION_CONFLICT', 'Nghề nghiệp đã được cập nhật.'));
  render(<CareerRoles />);
  await screen.findByText('Data Analyst');
  fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa Data Analyst' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Tên nghề nghiệp'), { target: { value: 'Tên đang soạn' } });
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Đang nhận hồ sơ' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(api.updateCareerRole).toHaveBeenCalledWith('data_analyst', expect.objectContaining({ name: 'Tên đang soạn', version: 3, acceptingApplications: false })));
  expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
  expect(within(dialog).getByLabelText('Tên nghề nghiệp')).toHaveValue('Tên đang soạn');
  expect(within(dialog).getByText(/Bản nháp của bạn vẫn được giữ/)).toBeInTheDocument();
});

it('confirms archive and shows readable historical snapshots', async () => {
  api.archiveCareerRole.mockResolvedValue({ ...role, status: 'archived', acceptingApplications: false, version: 4 });
  render(<CareerRoles />);
  await screen.findByText('Data Analyst');
  fireEvent.click(screen.getByRole('button', { name: 'Lịch sử Data Analyst' }));
  expect(await screen.findByText('SQL · 100%')).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đóng' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ Data Analyst' }));
  expect(api.archiveCareerRole).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xác nhận lưu trữ' }));
  await waitFor(() => expect(api.archiveCareerRole).toHaveBeenCalledWith('data_analyst', 3));
  expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu trữ');
});
