/**
 * TRẠNG THÁI PREVIEW (in-browser) — tài khoản demo + kịch bản đang chọn.
 *
 * Isolation (Section 10.2): mọi thứ ở đây chỉ chạy khi PREVIEW_ENABLED = true
 * (đã loại khỏi production build ở cổng `enabled.ts`). localStorage chỉ giữ
 * LỰA CHỌN bên trong phiên preview đang hoạt động — không phải cơ chế "kích
 * hoạt" preview: production không có module này trong bundle để đọc gì hết.
 */
import { PREVIEW_ENABLED } from "./enabled";

export const PREVIEW_SCENARIOS = [
  "populated",
  "empty",
  "loading-slow",
  "error",
  "unauthorized",
  "forbidden",
  "validation",
  "network",
  "large",
  "long-text",
] as const;
export type PreviewScenario = (typeof PREVIEW_SCENARIOS)[number];

export const PREVIEW_SCENARIO_LABELS: Record<PreviewScenario, string> = {
  populated: "Dữ liệu đầy đủ",
  empty: "Rỗng (empty state)",
  "loading-slow": "Đang tải chậm (skeleton)",
  error: "Lỗi hệ thống 500",
  unauthorized: "Hết phiên 401",
  forbidden: "Không có quyền 403",
  validation: "Lỗi validation 422",
  network: "Mất kết nối",
  large: "Dữ liệu lớn (phân trang)",
  "long-text": "Chữ dài (tràn dòng)",
};

const STORAGE_KEY = "vintern-preview-state";

interface PreviewState {
  account: string; // id tài khoản demo đang dùng
  scenario: PreviewScenario;
}

const listeners = new Set<() => void>();

function readStored(): PreviewState | null {
  if (!PREVIEW_ENABLED || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PreviewState>;
    if (typeof parsed.account !== "string" || !parsed.scenario) return null;
    if (!PREVIEW_SCENARIOS.includes(parsed.scenario)) return null;
    return { account: parsed.account, scenario: parsed.scenario };
  } catch {
    return null;
  }
}

let state: PreviewState | null = null;

/** Trạng thái hiện tại — null khi chưa chọn (dùng mặc định của tài khoản). */
export function previewState(): PreviewState | null {
  if (state === null) state = readStored();
  return state;
}

export function currentScenario(): PreviewScenario {
  return previewState()?.scenario ?? "populated";
}

export function currentAccountId(): string | null {
  return previewState()?.account ?? null;
}

/** Đổi tài khoản demo: ghi trạng thái rồi KHÔNG reload tự động — caller quyết
 *  (switcher sẽ reload để app bootstrap lại đúng luồng refresh thật). */
export function setPreviewAccount(account: string): void {
  if (!PREVIEW_ENABLED) return;
  persist({ account, scenario: currentScenario() });
}

export function setPreviewScenario(scenario: PreviewScenario): void {
  if (!PREVIEW_ENABLED) return;
  persist({ account: currentAccountId() ?? "", scenario });
}

export function resetPreviewState(): void {
  if (!PREVIEW_ENABLED || typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  state = null;
  notify();
}

function persist(next: PreviewState): void {
  state = next;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  notify();
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribePreview(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
