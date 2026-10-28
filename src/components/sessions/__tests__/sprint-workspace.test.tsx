import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { SprintDelivery, SprintWorkspace } from '../sprint-workspace';
import { getSprint, listTasks } from '@/lib/api/delivery';
import { getMembers } from '@/lib/api/academic';
import { listSessionWork } from '@/lib/api/session-work';
import { transitionSprint } from '@/lib/api/management';
import { clearSession, setSession } from '@/lib/auth/session';

vi.mock('@/lib/api/delivery', async original => ({ ...await original<typeof import('@/lib/api/delivery')>(), getSprint: vi.fn(), listTasks: vi.fn() }));
vi.mock('@/lib/api/academic', async original => ({ ...await original<typeof import('@/lib/api/academic')>(), getMembers: vi.fn() }));
vi.mock('@/lib/api/session-work', async original => ({ ...await original<typeof import('@/lib/api/session-work')>(), listSessionWork: vi.fn() }));
vi.mock('@/lib/api/management', async original => ({ ...await original<typeof import('@/lib/api/management')>(), transitionSprint: vi.fn() }));
vi.mock('@/components/product/sprint-overview', () => ({ SprintOverview: ({ onManage }: { onManage: () => void }) => <><a href="#sprint-task-list">Xem tất cả task</a><button onClick={onManage}>Quản lý task</button></> }));
vi.mock('@/components/product/sprint-management', () => ({ TaskManagement: ({ projectId, sprintId }: { projectId: string; sprintId: string }) => <p>Quản lý {projectId}/{sprintId}</p> }));
vi.mock('@/components/product/intern-work', () => ({ TaskDetail: ({ id }: { id: string }) => <p>Chi tiết {id}</p> }));

const sprint = { id: 'sp1', code: 'SP-1', name: 'Nền tảng', goal: 'Hoàn thành validation', status: 'planned', projectId: 'p1', sessionId: 's1', startDate: '2026-10-01', endDate: '2026-10-10', progress: null };
const task = { id: 't1', code: 'T-1', title: 'Ghi chú', status: 'todo' as const, priority: 'high' as const, progress: 0, dueDate: '2026-10-10', assigneeId: 'member-1', description: null, projectId: 'p1', sprintId: 'sp1', storyPoints: 2, version: 1, delivery: { blocked: true, submission: null } };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
beforeEach(() => {
  vi.clearAllMocks();
  setSession('test-token', { id: 'teacher', email: 'teacher@example.test', displayName: 'Teacher', roles: ['instructor'], permissions: ['sprints.view', 'projects.view', 'sessions.view', 'tasks.view', 'tasks.manage'] });
  vi.mocked(getSprint).mockResolvedValue(sprint);
  vi.mocked(transitionSprint).mockResolvedValue({ ...sprint, description: null, status: 'active' });
  vi.mocked(getMembers).mockResolvedValue([{ userId: 'MEMBER-1', displayName: 'Lan', email: 'lan@example.test', role: 'frontend' }]);
  vi.mocked(listSessionWork).mockImplementation(async q => ({ items: [task], total: 12, page: q.page ?? 1, pageSize: 10, totalPages: 2 }));
  vi.mocked(listTasks).mockResolvedValue({ items: [task], total: 1, page: 1, pageSize: 10, totalPages: 1 });
});
afterEach(() => act(() => clearSession()));

it('shows the complete Sprint context, team, blockers and functional management area', async () => {
  render(<SprintWorkspace id="sp1" basePath="/admin" />);
  expect(await screen.findByText('Hoàn thành validation')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Kích hoạt' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mở phiên thực tập →' })).toHaveAttribute('href', '/admin/sessions/s1');
  expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
  expect(await screen.findByText('Chờ phụ thuộc')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ghi chú' }).closest('li')).toHaveTextContent('Lan · Cao');
  expect(document.getElementById('sprint-task-list')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Quản lý task' }));
  expect(await screen.findByText('Quản lý p1/sp1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ghi chú' }));
  expect(await screen.findByText('Chi tiết t1')).toBeInTheDocument();
});

it('lets a sprint manager activate a planned Sprint from its direct detail route and refreshes its status', async () => {
  setSession('test-token', { id: 'teacher', email: 'teacher@example.test', displayName: 'Teacher', roles: ['instructor'], permissions: ['sprints.view', 'sprints.manage'] });
  vi.mocked(getSprint).mockResolvedValueOnce(sprint).mockResolvedValue({ ...sprint, status: 'active' });
  render(<SprintWorkspace id="sp1" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Kích hoạt' }));
  await waitFor(() => expect(transitionSprint).toHaveBeenCalledWith('sp1', 'active'));
  expect(await screen.findByText('Đang chạy')).toBeInTheDocument();
  expect(getSprint).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('button', { name: 'Kích hoạt' })).not.toBeInTheDocument();
});

it('keeps the planned Sprint and allows retry when activation is rejected', async () => {
  setSession('test-token', { id: 'teacher', email: 'teacher@example.test', displayName: 'Teacher', roles: ['instructor'], permissions: ['sprints.view', 'sprints.manage'] });
  vi.mocked(transitionSprint).mockRejectedValue(new Error('Activation rejected'));
  render(<SprintWorkspace id="sp1" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Kích hoạt' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Kích hoạt' })).toBeEnabled();
  expect(getSprint).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Đang chạy')).not.toBeInTheDocument();
});

it('paginates all Sprint tasks on the server and resets to page one after filtering', async () => {
  render(<SprintDelivery sprintId="sp1" projectId="p1" sessionId="s1" revision={0} onOpen={vi.fn()} />);
  await screen.findByRole('button', { name: 'Ghi chú' });
  fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
  await waitFor(() => expect(listSessionWork).toHaveBeenLastCalledWith(expect.objectContaining({ projectId: 'p1', sessionId: 's1', sprintId: 'sp1', page: 2 }), expect.any(AbortSignal)));
  fireEvent.change(screen.getByLabelText('Trạng thái task trong Sprint'), { target: { value: 'review' } });
  await waitFor(() => expect(listSessionWork).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'review', page: 1 }), expect.any(AbortSignal)));
  expect(getMembers).toHaveBeenCalledTimes(1);
});

it('does not request private team/work sections without their effective permissions', async () => {
  setSession('test-token', { id: 'viewer', email: 'viewer@example.test', displayName: 'Viewer', roles: [], permissions: ['sprints.view'] });
  render(<SprintWorkspace id="sp1" />);
  await screen.findByText('Hoàn thành validation');
  expect(screen.getByText(/Cần quyền xem đội hình và task/)).toBeInTheDocument();
  expect(getMembers).not.toHaveBeenCalled();
  expect(listSessionWork).not.toHaveBeenCalled();
});

it('debounces task search rather than requesting on every keystroke', async () => {
  render(<SprintDelivery sprintId="sp1" projectId="p1" sessionId="s1" revision={0} onOpen={vi.fn()} />);
  await screen.findByRole('button', { name: 'Ghi chú' });
  fireEvent.change(screen.getByLabelText('Tìm task trong Sprint'), { target: { value: 'G' } });
  fireEvent.change(screen.getByLabelText('Tìm task trong Sprint'), { target: { value: 'Ghi chú' } });
  expect(listSessionWork).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(listSessionWork).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Ghi chú', page: 1 }), expect.any(AbortSignal)));
  expect(listSessionWork).toHaveBeenCalledTimes(2);
});

it('keeps legacy project Sprints usable without a session endpoint', async () => {
  render(<SprintDelivery sprintId="sp1" projectId="p1" sessionId={null} revision={0} onOpen={vi.fn()} />);
  await screen.findByRole('button', { name: 'Ghi chú' });
  expect(getMembers).toHaveBeenCalledWith('projects', 'p1', expect.any(AbortSignal));
  expect(listTasks).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p1', sprintId: 'sp1', page: 1 }), expect.any(AbortSignal));
  expect(listSessionWork).not.toHaveBeenCalled();
});
