"use client";

import { useState } from "react";
import {
  PREVIEW_ACCOUNTS,
  PREVIEW_ACCOUNTS_BY_ID,
  resolvePreviewAccount,
} from "@/lib/preview/accounts";
import {
  PREVIEW_SCENARIOS,
  PREVIEW_SCENARIO_LABELS,
  currentAccountId,
  currentScenario,
  resetPreviewState,
  setPreviewAccount,
  setPreviewScenario,
  type PreviewScenario,
} from "@/lib/preview/store";
import { btn } from "@/components/product/primitives";

/**
 * BẢNG ĐIỀU KHIỂN PREVIEW — chỉ tồn tại ở dev/preview deploy (qua PreviewGate
 * import động). Đổi tài khoản/scenario → ghi trạng thái rồi reload để app
 * bootstrap lại đúng luồng refresh thật — không hack state app.
 */
export function PreviewSwitcher() {
  const [open, setOpen] = useState(false);
  // Giá trị đọc một lần lúc mount: đổi tài khoản/kịch bản luôn reload trang nên
  // không cần sync effect (tránh setState-in-effect).
  const [account] = useState(() => currentAccountId() ?? resolvePreviewAccount().id);
  const [scenario] = useState<PreviewScenario>(() => currentScenario());

  const active = PREVIEW_ACCOUNTS_BY_ID[account] ?? resolvePreviewAccount();

  function switchAccount(id: string) {
    setPreviewAccount(id);
    window.location.reload();
  }

  function switchScenario(next: PreviewScenario) {
    setPreviewScenario(next);
    window.location.reload();
  }

  return (
    <div
      data-vintern-preview="true"
      className="fixed bottom-4 left-4 z-[80] print:hidden"
    >
      {open ? (
        <div
          role="complementary"
          aria-label="Bảng điều khiển chế độ Preview"
          className="nb-toast-in mb-2 w-72 rounded-panel border border-border bg-card p-4 shadow-popover"
        >
          <p className="text-caption font-bold uppercase tracking-wide text-primary">
            Chế độ Preview · dữ liệu mô phỏng
          </p>

          <label className="mt-3 block text-caption font-medium text-muted-foreground">
            Tài khoản demo
            <select
              className="mt-1 w-full rounded-control border border-border bg-background px-2 py-2 text-small text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              value={account}
              onChange={(e) => switchAccount(e.target.value)}
            >
              {PREVIEW_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.hint}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-caption font-medium text-muted-foreground">
            Kịch bản dữ liệu
            <select
              className="mt-1 w-full rounded-control border border-border bg-background px-2 py-2 text-small text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              value={scenario}
              onChange={(e) => switchScenario(e.target.value as PreviewScenario)}
            >
              {PREVIEW_SCENARIOS.map((s) => (
                <option key={s} value={s}>
                  {PREVIEW_SCENARIO_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <dl className="mt-3 space-y-1 text-caption leading-5 text-muted-foreground">
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold">Email:</dt>
              <dd className="truncate">{active.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold">Mật khẩu:</dt>
              <dd>{active.password}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className={btn("secondary", "sm")}
              onClick={() => {
                resetPreviewState();
                window.location.reload();
              }}
            >
              Đặt lại
            </button>
            <button
              type="button"
              className={btn("ghost", "sm")}
              onClick={() => setOpen(false)}
            >
              Ẩn bảng
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent px-4 py-2 text-small font-semibold text-primary shadow-app-xs transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span aria-hidden="true">◈</span>
        Preview: {PREVIEW_SCENARIO_LABELS[scenario]}
      </button>
    </div>
  );
}
