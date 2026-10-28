"use client";

import * as React from "react";
import { Layers, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  catalogApi,
  type CatalogItem,
  type CatalogType,
} from "@/lib/client/api-org";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import {
  Empty,
  KeyValue,
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  LineButton,
  useToastAction,
} from "./admin-shared";

/* ============================ dialog tạo loại danh mục ============================ */

function CreateTypeDialog({
  open,
  onOpenChange,
  reload,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reload: () => void;
  onCreated: (code: string) => void;
}) {
  const [form, setForm] = React.useState({ code: "", name: "" });
  const action = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  React.useEffect(() => {
    if (open) setForm({ code: "", name: "" });
  }, [open]);

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Cần nhập mã và tên loại danh mục.");
      return;
    }
    action.run(async () => {
      const created = await catalogApi.createType({ code: form.code.trim(), name: form.name.trim() });
      toast.success(`Đã tạo loại danh mục "${created.name}".`);
      onCreated(created.code);
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !action.busy && onOpenChange(o)}
      title="Tạo loại danh mục"
      description="Loại danh mục gom các giá trị cấu hình (vd: cơ sở đào tạo, kỳ học)."
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={action.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={action.busy}>
            {action.busy ? <InlineSpinner className="size-4" /> : <Plus className="size-4 icon" />}
            {action.busy ? "Đang tạo…" : "Tạo loại"}
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Mã loại" hint="Chỉ a-z, 0-9 và gạch nối (3–64 ký tự), vd: campus.">
          <FormInput
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="campus"
            className="font-mono"
            autoComplete="off"
          />
        </Field>
        <Field label="Tên loại">
          <FormInput
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Cơ sở đào tạo"
          />
        </Field>
      </div>
    </AdminDialog>
  );
}

/* ============================ dialog tạo / sửa giá trị ============================ */

function ItemFormDialog({
  open,
  onOpenChange,
  typeCode,
  editing,
  reload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeCode: string | null;
  editing: CatalogItem | null;
  reload: () => void;
}) {
  const [form, setForm] = React.useState({ name: "", code: "", value: "", sortOrder: "1" });
  const action = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  React.useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name,
              code: editing.code,
              value: editing.value,
              sortOrder: String(editing.sortOrder),
            }
          : { name: "", code: "", value: "", sortOrder: "1" }
      );
    }
  }, [open, editing]);

  const submit = () => {
    if (!typeCode) return;
    if (!form.name.trim()) {
      toast.error("Cần nhập tên giá trị.");
      return;
    }
    action.run(async () => {
      if (editing) {
        await catalogApi.updateItem(typeCode, editing.id, {
          name: form.name.trim(),
          value: form.value.trim(),
          sortOrder: Number(form.sortOrder) || 1,
        });
        toast.success(`Đã cập nhật "${form.name.trim()}".`);
      } else {
        const created = await catalogApi.createItem(typeCode, {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          value: form.value.trim(),
          sortOrder: Number(form.sortOrder) || 1,
        });
        toast.success(`Đã thêm giá trị "${created.name}".`);
      }
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !action.busy && onOpenChange(o)}
      title={editing ? `Sửa giá trị "${editing.name}"` : "Thêm giá trị danh mục"}
      description={editing ? `Loại: ${typeCode} · mã: ${editing.code}.` : `Thêm giá trị mới vào loại "${typeCode}".`}
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={action.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={action.busy}>
            {action.busy ? <InlineSpinner className="size-4" /> : editing ? <Pencil className="size-4 icon" /> : <Plus className="size-4 icon" />}
            {action.busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Thêm giá trị"}
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tên hiển thị">
          <FormInput
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Cơ sở Hà Nội"
          />
        </Field>
        {editing ? null : (
          <Field label="Mã giá trị" hint="Bỏ trống sẽ tự sinh từ tên (a-z, 0-9, gạch nối).">
            <FormInput
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="cs-hn"
              className="font-mono"
              autoComplete="off"
            />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giá trị" hint="Giá trị lưu trong hệ thống (vd: HN).">
            <FormInput
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="HN"
              className="font-mono"
            />
          </Field>
          <Field label="Thứ tự hiển thị">
            <FormInput
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              className="font-mono"
            />
          </Field>
        </div>
      </div>
    </AdminDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminCatalogs() {
  const types = useResource(() => catalogApi.types({ page: 1, pageSize: 100 }), []);
  const [selectedTypeCode, setSelectedTypeCode] = React.useState<string | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<CatalogItem | null>(null);

  const typeItems: CatalogType[] = types.data?.data ?? [];
  const selectedType = typeItems.find((t) => t.code === selectedTypeCode) ?? null;

  React.useEffect(() => {
    if (!selectedTypeCode && typeItems.length > 0) setSelectedTypeCode(typeItems[0].code);
  }, [typeItems, selectedTypeCode]);

  const items = useResource(
    () => (selectedType ? catalogApi.items(selectedType.code, { page: 1, pageSize: 100 }) : Promise.resolve(null)),
    [selectedType?.code]
  );
  const itemRows: CatalogItem[] = items.data?.data ?? [];

  // Đồng bộ giá trị đang chọn với dữ liệu mới nhất.
  React.useEffect(() => {
    setSelectedItem((prev) => (prev ? itemRows.find((i) => i.id === prev.id) ?? null : null));
  }, [itemRows]);

  const [typeFormOpen, setTypeFormOpen] = React.useState(false);
  const [itemFormOpen, setItemFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);

  const toggleAction = useToastAction(() => items.reload());
  const toggleActive = (item: CatalogItem, active: boolean) => {
    if (!selectedType) return;
    toggleAction.run(async () => {
      try {
        await catalogApi.updateItem(selectedType.code, item.id, { isActive: active });
        toast.success(`"${item.name}" ${active ? "đã kích hoạt" : "đã tắt"}.`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Dữ liệu vừa được cập nhật — đang tải lại.");
          items.reload();
          return;
        }
        throw err;
      }
    });
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Danh mục"
        description="Quản lý loại danh mục và giá trị cấu hình dùng chung (cơ sở, kỳ học, trạng thái…)."
        actions={
          <BrandButton onClick={() => setTypeFormOpen(true)}>
            <Plus className="size-4 icon" /> Tạo loại danh mục
          </BrandButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cột 1: loại danh mục */}
        <Panel className="overflow-hidden">
          <PanelHeader title="Loại danh mục" icon={<Layers className="size-4 icon" />} />
          {types.loading ? (
            <div className="px-5 py-4">
              <LoadingBlock rows={3} />
            </div>
          ) : types.error ? (
            <div className="px-5 py-4">
              <ErrorBlock error={types.error} onRetry={types.reload} />
            </div>
          ) : typeItems.length === 0 ? (
            <Empty
              icon={<Layers className="icon" />}
              title="Chưa có loại danh mục"
              description="Tạo loại đầu tiên để bắt đầu."
              action={
                <BrandButton onClick={() => setTypeFormOpen(true)}>
                  <Plus className="size-4 icon" /> Tạo loại
                </BrandButton>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {typeItems.map((t) => {
                const active = t.code === selectedTypeCode;
                return (
                  <li key={t.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTypeCode(t.code);
                        setSelectedItem(null);
                      }}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                        active ? "bg-brand/[0.08]" : "hover:bg-panel-2/60"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${active ? "text-brand-bright" : "text-ink"}`}>
                          {t.name}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-faint">{t.code}</span>
                      </span>
                      <ToneBadge tone={active ? "brand" : "zinc"}>{t.itemCount ?? 0}</ToneBadge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Cột 2: giá trị của loại đang chọn */}
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Giá trị"
            description={selectedType ? `${selectedType.name} · ${selectedType.code}` : "Chọn một loại danh mục"}
            icon={<Layers className="size-4 icon" />}
            actions={
              selectedType ? (
                <LineButton
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setItemFormOpen(true);
                  }}
                >
                  <Plus className="size-3.5 icon" /> Thêm
                </LineButton>
              ) : undefined
            }
          />
          {!selectedType ? (
            <Empty icon={<Layers className="icon" />} title="Chưa chọn loại danh mục" description="Chọn loại bên trái để xem giá trị." />
          ) : items.loading ? (
            <div className="px-5 py-4">
              <LoadingBlock rows={3} />
            </div>
          ) : items.error ? (
            <div className="px-5 py-4">
              <ErrorBlock error={items.error} onRetry={items.reload} />
            </div>
          ) : itemRows.length === 0 ? (
            <Empty
              icon={<Plus className="icon" />}
              title="Chưa có giá trị nào"
              description="Thêm giá trị đầu tiên cho loại này."
              action={
                <BrandButton
                  onClick={() => {
                    setEditingItem(null);
                    setItemFormOpen(true);
                  }}
                >
                  <Plus className="size-4 icon" /> Thêm giá trị
                </BrandButton>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {itemRows.map((item) => {
                const active = item.id === selectedItem?.id;
                return (
                  <li key={item.id} className={`transition-colors ${active ? "bg-brand/[0.06]" : ""}`}>
                    <div className="flex items-center gap-3 px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        aria-pressed={active}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-medium ${active ? "text-brand-bright" : "text-ink"}`}>
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] text-faint">{item.code}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-dim">
                          <span className="font-mono">{item.value || "—"}</span>
                          <span className="text-faint">· thứ tự {item.sortOrder}</span>
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                        onClick={() => {
                          setEditingItem(item);
                          setItemFormOpen(true);
                        }}
                        aria-label={`Sửa ${item.name}`}
                      >
                        <Pencil className="size-4 icon" />
                      </Button>
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(v) => toggleActive(item, v)}
                        disabled={toggleAction.busy}
                        aria-label={`Kích hoạt ${item.name}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Cột 3: chi tiết giá trị đang chọn */}
        <Panel>
          <PanelHeader title="Chi tiết" description="Thông tin đầy đủ của giá trị đang chọn." icon={<Layers className="size-4 icon" />} />
          {!selectedItem ? (
            <Empty icon={<Layers className="icon" />} title="Chưa chọn giá trị" description="Bấm một giá trị ở giữa để xem chi tiết." />
          ) : (
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <KeyValue label="ID">
                <span className="font-mono text-xs">{selectedItem.id}</span>
              </KeyValue>
              <KeyValue label="Mã">
                <span className="font-mono text-xs">{selectedItem.code}</span>
              </KeyValue>
              <KeyValue label="Tên">{selectedItem.name}</KeyValue>
              <KeyValue label="Giá trị">
                <span className="font-mono text-xs">{selectedItem.value || "—"}</span>
              </KeyValue>
              <KeyValue label="Thứ tự">
                <span className="font-mono">{selectedItem.sortOrder}</span>
              </KeyValue>
              <KeyValue label="Trạng thái">
                <ToneBadge tone={selectedItem.isActive ? "emerald" : "zinc"} dot>
                  {selectedItem.isActive ? "Đang dùng" : "Đã tắt"}
                </ToneBadge>
              </KeyValue>
              <KeyValue label="Loại danh mục">
                <span className="font-mono text-xs">{selectedItem.typeCode}</span>
              </KeyValue>
              <KeyValue label="Loại tạo lúc">
                {selectedType?.createdAt ? formatDate(selectedType.createdAt) : "—"}
              </KeyValue>
            </div>
          )}
        </Panel>
      </div>

      <CreateTypeDialog
        open={typeFormOpen}
        onOpenChange={setTypeFormOpen}
        reload={types.reload}
        onCreated={(code) => setSelectedTypeCode(code)}
      />
      <ItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        typeCode={selectedTypeCode}
        editing={editingItem}
        reload={items.reload}
      />
    </ViewFrame>
  );
}
