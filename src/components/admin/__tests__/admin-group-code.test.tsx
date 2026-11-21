import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminGroups } from '@/components/product/admin-management';

const api = vi.hoisted(() => ({ listGroups: vi.fn(), saveGroup: vi.fn() }));
vi.mock('@/lib/api/admin', () => api);

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() { this.setAttribute('open', ''); } },
    close: { configurable: true, value() { this.removeAttribute('open'); } },
  });
});

beforeEach(() => {
  vi.resetAllMocks();
  api.listGroups.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
});

describe('AdminGroups native group-code validation', () => {
  it('supplies a valid modern HTML pattern that enforces the server code alphabet and length', async () => {
    render(<AdminGroups />);
    await screen.findByText('Chưa có nhóm nào');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhóm' }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo nhóm' });
    const code = within(dialog).getByRole('textbox', { name: 'Mã nhóm' });
    expect(code).toBeRequired();
    const source = code.getAttribute('pattern');
    expect(source).toBeTruthy();
    // HTML pattern uses Unicode Sets (v) and matches the whole input. Compile
    // the rendered DOM value because JSDOM does not implement that browser rule.
    const pattern = new RegExp(`^(?:${source})$`, 'v');
    for (const [value, accepted] of [
      ['qa-buttons-20261116', true],
      ['qa.group_2026', true],
      ['123', true],
      ['QA-BUTTONS-20261116', false],
      ['ab', false],
      ['has space', false],
      ['lower/code', false],
      ['a'.repeat(65), false],
    ] as const) {
      expect(pattern.test(value), value).toBe(accepted);
    }
    expect(code).toHaveAccessibleDescription('3–64 ký tự: chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.');
    expect(api.saveGroup).not.toHaveBeenCalled();
  });
});
