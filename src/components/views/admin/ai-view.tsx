"use client";

import * as React from "react";
import { BrainCircuit, Save, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AiConfiguration } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import {
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/view";
import {
  BrandButton,
  Field,
  FormInput,
  FormSelect,
} from "./admin-shared";

const MODEL_PATTERN = /^[a-z0-9.-]+$/;
const RETRY_OPTIONS = [0, 1, 2, 3].map((n) => ({ value: String(n), label: `${n} lần` }));

export function AdminAiView() {
  const config = useResource(() => adminApi.aiConfiguration(), []);
  const data = config.data;

  const [form, setForm] = React.useState({ model: "", timeoutMs: "60000", maxRetries: "2" });
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      setForm({ model: data.model, timeoutMs: String(data.timeoutMs), maxRetries: String(data.maxRetries) });
    }
  }, [data]);

  const modelError =
    touched && form.model && !MODEL_PATTERN.test(form.model)
      ? "Mã mô hình chỉ gồm chữ thường, số, dấu chấm và gạch nối (vd: gemini-2.0-flash)."
      : null;
  const timeout = Number(form.timeoutMs);
  const timeoutError =
    touched && !(Number.isFinite(timeout) && timeout >= 10000 && timeout <= 180000)
      ? "Timeout phải nằm trong khoảng 10.000 – 180.000 ms."
      : null;
  const formValid = Boolean(
    form.model && MODEL_PATTERN.test(form.model) && Number.isFinite(timeout) && timeout >= 10000 && timeout <= 180000
  );

  const save = async () => {
    setTouched(true);
    if (!formValid) {
      toast.error("Vui lòng sửa các trường được đánh dấu trước khi lưu.");
      return;
    }
    setSaving(true);
    try {
      const updated = await adminApi.updateAiConfiguration({
        model: form.model.trim(),
        timeoutMs: timeout,
        maxRetries: Number(form.maxRetries),
      });
      config.setData(updated);
      toast.success(`Đã lưu cấu hình AI — phiên bản v${updated.version}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu được cấu hình AI.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Cấu hình AI"
        description="Mô hình, timeout và số lần retry cho toàn bộ tính năng AI: phỏng vấn đầu vào, code review và mentor chat."
      />

      {config.loading ? (
        <LoadingBlock variant="detail" rows={5} />
      ) : config.error ? (
        <ErrorBlock error={config.error} onRetry={config.reload} />
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form cấu hình */}
          <Panel className="lg:col-span-3">
            <PanelHeader
              title="Tham số mô hình"
              description="Áp dụng cho mọi luồng AI trên nền tảng"
              icon={<BrainCircuit className="icon" />}
              actions={
                <ToneBadge tone="brand" className="font-mono">
                  v{data.version}
                </ToneBadge>
              }
            />
            <div className="space-y-5 p-5">
              <Field
                label="Mã mô hình"
                hint="Định dạng: chữ thường, số, dấu chấm, gạch nối — vd: gemini-2.0-flash"
                error={modelError}
              >
                <FormInput
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  onBlur={() => setTouched(true)}
                  placeholder="gemini-2.0-flash"
                  className="font-mono"
                  aria-invalid={Boolean(modelError)}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Timeout (ms)"
                  hint="Cho phép 10.000 – 180.000 ms"
                  error={timeoutError}
                >
                  <FormInput
                    type="number"
                    min={10000}
                    max={180000}
                    step={1000}
                    value={form.timeoutMs}
                    onChange={(e) => setForm((f) => ({ ...f, timeoutMs: e.target.value }))}
                    onBlur={() => setTouched(true)}
                    className="font-mono"
                    aria-invalid={Boolean(timeoutError)}
                  />
                </Field>
                <Field label="Số lần retry" hint="0 – 3 lần khi gọi lỗi">
                  <FormSelect
                    value={form.maxRetries}
                    onChange={(v) => setForm((f) => ({ ...f, maxRetries: v }))}
                    options={RETRY_OPTIONS}
                    ariaLabel="Chọn số lần retry"
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-faint">
                  Mỗi lần lưu sẽ tăng phiên bản cấu hình (hiện tại <span className="font-mono">v{data.version}</span>).
                </p>
                <BrandButton onClick={save} disabled={saving || !formValid}>
                  {saving ? <InlineSpinner className="size-4" /> : <Save className="size-4 icon" />}
                  {saving ? "Đang lưu…" : "Lưu cấu hình"}
                </BrandButton>
              </div>
            </div>
          </Panel>

          {/* Trạng thái nhà cung cấp */}
          <div className="space-y-6 lg:col-span-2">
            <Panel>
              <PanelHeader title="Trạng thái nhà cung cấp" />
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-dim">Provider</span>
                  {data.provider === "connected" ? (
                    <ToneBadge tone="emerald" dot>
                      Đã kết nối
                    </ToneBadge>
                  ) : (
                    <ToneBadge tone="rose" dot>
                      {data.provider}
                    </ToneBadge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-dim">Mô hình hiện tại</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-brand-bright">
                    <Sparkles className="size-3.5 icon" />
                    {data.model}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-dim">Chế độ dự phòng</span>
                  <ToneBadge tone={data.fallbackEnabled ? "teal" : "zinc"} dot={data.fallbackEnabled}>
                    {data.fallbackEnabled ? "Đang bật" : "Đang tắt"}
                  </ToneBadge>
                </div>
              </div>
            </Panel>

            {/* Cảnh báo fallback */}
            <div className="rounded-2xl border border-amber/30 bg-amber/[0.07] p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber/15 text-amber">
                  <TriangleAlert className="size-4.5 icon" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber">Chế độ dự phòng dữ liệu AI</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-dim">
                    Khi cơ sở dữ liệu nhà cung cấp không hợp lệ, hệ thống trả về mã{" "}
                    <span className="font-mono text-amber">invalid_database_fallback</span> và tự chuyển sang bộ dữ
                    liệu mẫu nội bộ — các buổi phỏng vấn, code review vẫn tiếp tục nhưng kết quả mang tính tham
                    khảo. Hãy kiểm tra provider nếu thấy tình trạng này kéo dài.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ViewFrame>
  );
}
