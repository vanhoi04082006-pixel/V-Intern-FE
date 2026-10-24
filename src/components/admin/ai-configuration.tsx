"use client";
import { useCallback, useState } from "react";
import {
  getAiConfiguration,
  saveAiConfiguration,
  type parseAiConfiguration,
} from "@/lib/api/system-admin";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  Badge,
  buttonClass,
  Field,
  InlineAlert,
  inputClass,
  PageTitle,
  Panel,
} from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { BusinessAgentMonitor } from './business-agent-monitor';

export function AiConfiguration() {
  const state = useResource(
    useCallback((signal: AbortSignal) => getAiConfiguration(signal), []),
  );
  return (
    <div className="space-y-5">
      <PageTitle
        title="Cấu hình AI"
        subtitle="Model và giới hạn áp dụng cho lời gọi mới; từng kết quả vẫn lưu model và phiên bản prompt thực tế."
      />
      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.data ? (
        <AiConfigurationForm
          key={state.data.policy.version}
          config={state.data}
          onSaved={state.reload}
        />
      ) : null}
      <BusinessAgentMonitor />
    </div>
  );
}

function AiConfigurationForm({
  config,
  onSaved,
}: {
  config: ReturnType<typeof parseAiConfiguration>;
  onSaved: () => void;
}) {
  const [policy, setPolicy] = useState(config.policy);
  const action = useAction();
  return (
    <Panel title="Model & thực thi">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            await saveAiConfiguration(policy);
            onSaved();
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone={config.provider ? "sky" : "gray"}>
            Provider: {config.provider ?? "Chưa bật"}
          </Badge>
          <Badge tone={config.credentialsConfigured ? "green" : "amber"}>
            {config.credentialsConfigured
              ? "Đã có credential ở server"
              : "Chưa có credential ở server"}
          </Badge>
          <Badge>Phiên bản {policy.version}</Badge>
        </div>

        <InlineAlert tone="info">
          API key được quản lý tại máy chủ. Lưu model không tự bật provider hoặc
          xác nhận model có quyền truy cập. Nếu model/provider từ chối, lỗi được
          ghi vào lịch sử gọi AI.
        </InlineAlert>

        {config.source === "invalid_database_fallback" && (
          <InlineAlert tone="warning" title="Cấu hình database không hợp lệ">
            Hệ thống đang dùng cấu hình môi trường thay thế. Hãy lưu lại cấu
            hình hợp lệ để ghi đè.
          </InlineAlert>
        )}

        <Field
          label="Gemini model ID"
          htmlFor="ai-policy-model"
          required
          hint="Bắt đầu bằng “gemini…”, tối đa 106 ký tự. Ví dụ: gemini-2.0-flash-001"
        >
          <input
            id="ai-policy-model"
            className={inputClass}
            required
            pattern="gemini[a-z0-9._-]+"
            maxLength={106}
            value={policy.model}
            onChange={(e) => setPolicy({ ...policy, model: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Timeout mỗi lần gọi (ms)"
            htmlFor="ai-policy-timeout"
            required
            hint="Trong khoảng 10.000 – 180.000 ms"
          >
            <input
              id="ai-policy-timeout"
              className={inputClass}
              type="number"
              required
              min={10000}
              max={180000}
              value={policy.timeoutMs}
              onChange={(e) =>
                setPolicy({ ...policy, timeoutMs: Number(e.target.value) })
              }
            />
          </Field>
          <Field
            label="Số retry lỗi tạm thời"
            htmlFor="ai-policy-retries"
            required
            hint="0 – 3 lần; không áp dụng cho lỗi credential/permission"
          >
            <input
              id="ai-policy-retries"
              className={inputClass}
              type="number"
              required
              min={0}
              max={3}
              value={policy.maxRetries}
              onChange={(e) =>
                setPolicy({ ...policy, maxRetries: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          Không retry lỗi credential/permission. Structured output sai chỉ được
          sửa một lần ở các module có schema repair; không bỏ qua validation
          hoặc tự tạo điểm đạt.
        </p>

        {Boolean(action.error) && (
          <ErrorState title="Không thể lưu thay đổi" error={action.error} />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button className={buttonClass} disabled={action.busy}>
            {action.busy ? "Đang lưu…" : "Lưu cấu hình AI"}
          </button>
          {action.busy && (
            <span className="text-xs text-slate-500" role="status">
              Đang gửi cấu hình tới Backend…
            </span>
          )}
        </div>
      </form>
    </Panel>
  );
}
