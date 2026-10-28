"use client";

import * as React from "react";
import { Check, Eye, EyeOff, Lock, Pencil, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminSetting } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import {
  Empty,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import { FormInput, TBody, Td, THead, Th, Tr } from "./admin-shared";

const MASK = "••••••••";

export function AdminSettingsView() {
  const list = useResource(() => adminApi.settings(), []);
  const rows = list.data ?? [];

  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startEdit = (setting: AdminSetting) => {
    setEditingKey(setting.key);
    setDraft(setting.value === MASK ? "" : setting.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft("");
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    if (!draft.trim()) {
      toast.error("Giá trị không được để trống.");
      return;
    }
    setSaving(true);
    try {
      const updated = await adminApi.updateSetting(editingKey, draft.trim());
      list.setData((prev) =>
        prev ? prev.map((s) => (s.key === updated.key ? updated : s)) : prev
      );
      toast.success(`Đã lưu cấu hình ${updated.key}.`);
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu được cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Cài đặt hệ thống"
        description="Các tham số vận hành toàn nền tảng — khóa bí mật chỉ xem/che, không sửa trực tiếp từ giao diện."
      />

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<Settings2 className="icon" />}
            title="Chưa có khóa cấu hình nào"
            description="Danh sách cài đặt sẽ xuất hiện khi hệ thống khởi tạo xong."
          />
        </div>
      ) : (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Khóa cấu hình"
            description={`${rows.length} khóa · ${rows.filter((r) => r.isSecret).length} khóa bí mật`}
            icon={<Settings2 className="icon" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <THead>
                <tr>
                  <Th>Khóa</Th>
                  <Th>Giá trị</Th>
                  <Th>Mô tả</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </THead>
              <TBody>
                {rows.map((setting) => {
                  const isEditing = editingKey === setting.key;
                  const isRevealed = revealed.has(setting.key);
                  return (
                    <Tr key={setting.key}>
                      <Td className="whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-ink">{setting.key}</span>
                        {setting.isSecret ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber">
                            <Lock className="size-3 icon" /> Bí mật
                          </span>
                        ) : null}
                      </Td>
                      <Td className="min-w-[220px]">
                        {isEditing ? (
                          <FormInput
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                            aria-label={`Giá trị mới cho ${setting.key}`}
                          />
                        ) : setting.isSecret ? (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="font-mono text-xs text-dim"
                              title={setting.value === MASK ? "Giá trị được che bởi máy chủ" : setting.value}
                            >
                              {isRevealed ? setting.value : MASK}
                            </span>
                            {setting.value === MASK && isRevealed ? (
                              <span className="text-[11px] text-faint">(che bởi máy chủ)</span>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-md text-faint hover:bg-panel-2 hover:text-ink"
                              onClick={() => toggleReveal(setting.key)}
                              aria-label={isRevealed ? `Ẩn giá trị ${setting.key}` : `Hiện giá trị ${setting.key}`}
                            >
                              {isRevealed ? <EyeOff className="size-3.5 icon" /> : <Eye className="size-3.5 icon" />}
                            </Button>
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-ink">{setting.value}</span>
                        )}
                      </Td>
                      <Td className="max-w-[320px]">
                        <span className="text-sm text-dim">{setting.description}</span>
                      </Td>
                      <Td className="text-right">
                        {isEditing ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-emerald-300 hover:bg-emerald-500/10"
                              onClick={saveEdit}
                              disabled={saving}
                              aria-label="Lưu"
                            >
                              {saving ? <InlineSpinner className="size-3.5" /> : <Check className="size-4 icon" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-rose hover:bg-rose/10"
                              onClick={cancelEdit}
                              disabled={saving}
                              aria-label="Hủy"
                            >
                              <X className="size-4 icon" />
                            </Button>
                          </span>
                        ) : setting.isSecret ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="size-8 rounded-lg text-faint"
                            title="Khóa bí mật — không sửa từ giao diện"
                            aria-label="Khóa bí mật"
                          >
                            <Lock className="size-4 icon" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                            onClick={() => startEdit(setting)}
                            aria-label={`Sửa ${setting.key}`}
                          >
                            <Pencil className="size-4 icon" />
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </table>
          </div>
        </Panel>
      )}

      <p className="mt-4 text-xs text-faint">
        Nhấn biểu tượng bút chì để sửa trực tiếp — Enter để lưu, Esc để hủy. Khóa bí mật (smtp.apiKey, jwt.secret)
        được che phía máy chủ và chỉ cấp phép qua quy trình riêng.
      </p>
    </ViewFrame>
  );
}
