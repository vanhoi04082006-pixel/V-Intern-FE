"use client";
import { useCallback } from "react";
import { ownReplacements } from "@/lib/api/replacements";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { btn } from "@/components/product/primitives";
export function ReplacementHistory() {
  const history = useResource(
    useCallback((signal: AbortSignal) => ownReplacements(signal), []),
  );
  return (
    <section
      aria-label="Lịch sử thay đổi phân công"
      className="space-y-4 border-t border-slate-200 pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Thay đổi phân công
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quyết định liên quan trực tiếp đến bạn, kể cả khi phân công đã kết
            thúc.
          </p>
        </div>
        <button
          className={btn("secondary")}
          onClick={history.reload}
          disabled={history.loading}
        >
          Cập nhật lịch sử
        </button>
      </div>
      {history.loading && <LoadingState label="Đang tải lịch sử phân công…" />}
      {Boolean(history.error) && (
        <ErrorState error={history.error} onRetry={history.reload} />
      )}
      {history.data &&
        (history.data.items.length ? (
          <>
            <ol className="divide-y divide-slate-200">
              {history.data.items.map((item) => (
                <li
                  key={item.result.replacementId}
                  className="space-y-2 py-4 text-sm"
                >
                  <p className="text-xs text-slate-500">
                    {new Date(item.result.approvedAt).toLocaleString("vi-VN")} ·{" "}
                    {item.sessionName}
                  </p>
                  <h3 className="font-semibold text-slate-900">
                    {item.projectName}
                  </h3>
                  <p className="leading-6 text-slate-600">
                    Lý do: {item.result.reason}
                  </p>
                  <p className="text-slate-500">
                    {item.result.transferredTaskIds.length} nhiệm vụ được bàn
                    giao · {item.result.preservedTaskCount} bài và phần lịch sử
                    giữ nguyên.
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500">
              Hiển thị tối đa {history.data.limit} quyết định gần nhất. Quyền
              repository được đối chiếu riêng; xem thông báo GitHub để biết tình
              trạng lời mời.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Chưa có quyết định thay đổi phân công liên quan đến bạn.
          </p>
        ))}
    </section>
  );
}
