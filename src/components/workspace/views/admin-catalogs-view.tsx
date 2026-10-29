"use client";

/**
 * Danh mục — quản lý loại danh mục (catalog types) và mục danh mục
 * (catalog items: giá trị, thứ tự, bật/tắt).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListTree, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createCatalogItem,
  createCatalogType,
  fetchCatalogItems,
  fetchCatalogTypes,
  updateCatalogItem,
  type CatalogItemEntry,
  type CatalogType,
} from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import {
  Chip,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  SectionCard,
  type Column,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AdminCatalogsView() {
  const queryClient = useQueryClient();
  const [typeCreateOpen, setTypeCreateOpen] = useState(false);
  const [itemCreateOpen, setItemCreateOpen] = useState(false);
  const [typeCode, setTypeCode] = useState("all");
  const [editing, setEditing] = useState<CatalogItemEntry | null>(null);

  const { data: types, isLoading: typesLoading, error: typesError, refetch: refetchTypes } = useQuery({
    queryKey: ["admin-catalog-types"],
    queryFn: ({ signal }) => fetchCatalogTypes(signal),
  });

  const { data: items, isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = useQuery({
    queryKey: ["admin-catalog-items", typeCode],
    queryFn: ({ signal }) => fetchCatalogItems(typeCode === "all" ? undefined : typeCode, signal),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-catalog-types"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-catalog-items"] });
  };

  const typeColumns: Column<CatalogType>[] = [
    {
      key: "code",
      header: "Mã",
      render: (t) => <span className="font-mono text-[12px] font-bold text-blue">{t.code}</span>,
    },
    { key: "name", header: "Tên", render: (t) => <span className="font-semibold text-ink">{t.name}</span> },
  ];

  const itemColumns: Column<CatalogItemEntry>[] = [
    {
      key: "code",
      header: "Mã",
      render: (i) => <span className="font-mono text-[12px] font-bold text-blue">{i.code}</span>,
    },
    { key: "name", header: "Tên", render: (i) => <span className="font-semibold text-ink">{i.name}</span> },
    { key: "value", header: "Giá trị", render: (i) => <span className="font-mono text-[12px] text-ink-soft">{i.value ?? "—"}</span> },
    {
      key: "isActive",
      header: "Trạng thái",
      render: (i) => (i.isActive ? <Chip tone="green">Đang dùng</Chip> : <Chip>Tắt</Chip>),
    },
    { key: "sortOrder", header: "Thứ tự", render: (i) => <span className="font-bold">{i.sortOrder}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục"
        description="Danh mục dùng chung cho toàn hệ thống — công nghệ, mức độ, nhóm lĩnh vực…"
      />

      <SectionCard
        title="Loại danh mục"
        description="Nhóm các mục danh mục theo loại."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-2 border-ink/20 font-bold"
            onClick={() => setTypeCreateOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Tạo loại
          </Button>
        }
      >
        {typesLoading ? (
          <LoadingState label="Đang tải loại danh mục…" />
        ) : typesError ? (
          <ErrorState message={errorMessage(typesError)} onRetry={() => void refetchTypes()} />
        ) : !types || types.data.length === 0 ? (
          <ListTable columns={typeColumns} rows={[]} rowKey={(t) => t.id} emptyTitle="Chưa có loại danh mục" emptyDescription="Tạo loại đầu tiên để nhóm các mục." />
        ) : (
          <ListTable columns={typeColumns} rows={types.data} rowKey={(t) => t.id} />
        )}
      </SectionCard>

      <SectionCard
        title="Mục danh mục"
        description="Nhấn vào một dòng để sửa tên, giá trị, thứ tự hoặc bật/tắt."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-2 border-ink/20 font-bold"
            onClick={() => setItemCreateOpen(true)}
          >
            <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
            Tạo mục
          </Button>
        }
      >
        <div className="mb-4">
          <Select
            value={typeCode}
            onValueChange={setTypeCode}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[280px]`} aria-label="Lọc loại danh mục">
              <SelectValue placeholder="Loại danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi loại danh mục</SelectItem>
              {(types?.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.code}>
                  {t.name} ({t.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {itemsLoading ? (
          <LoadingState label="Đang tải mục danh mục…" />
        ) : itemsError ? (
          <ErrorState message={errorMessage(itemsError)} onRetry={() => void refetchItems()} />
        ) : !items || items.data.length === 0 ? (
          <ListTable columns={itemColumns} rows={[]} rowKey={(i) => i.id} emptyTitle="Chưa có mục nào" emptyDescription="Tạo mục danh mục cho loại đã chọn." />
        ) : (
          <ListTable columns={itemColumns} rows={items.data} rowKey={(i) => i.id} onRowClick={(i) => setEditing(i)} />
        )}
      </SectionCard>

      <CreateCatalogTypeDialog
        open={typeCreateOpen}
        onOpenChange={setTypeCreateOpen}
        onCreated={() => {
          invalidate();
          setTypeCreateOpen(false);
        }}
      />
      <CreateCatalogItemDialog
        open={itemCreateOpen}
        onOpenChange={setItemCreateOpen}
        types={types?.data ?? []}
        defaultTypeCode={typeCode === "all" ? "" : typeCode}
        onCreated={() => {
          invalidate();
          setItemCreateOpen(false);
        }}
      />
      <EditCatalogItemDialog
        item={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onChanged={() => void queryClient.invalidateQueries({ queryKey: ["admin-catalog-items"] })}
      />
    </div>
  );
}

/* ───────────────────────── Tạo loại danh mục ───────────────────────── */

function CreateCatalogTypeDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => createCatalogType({ code: code.trim(), name: name.trim() }),
    onSuccess: () => {
      toast({ title: "Đã tạo loại danh mục ✦" });
      setCode("");
      setName("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo loại thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo loại danh mục</DialogTitle>
          <DialogDescription>vd: công nghệ, mức độ khó, nhóm lĩnh vực…</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="type-code">Mã loại</Label>
            <Input id="type-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="vd: technology" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="type-name">Tên loại</Label>
            <Input id="type-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="vd: Công nghệ" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={code.trim().length === 0 || name.trim().length === 0 || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo loại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Tạo mục danh mục ───────────────────────── */

function CreateCatalogItemDialog({
  open,
  onOpenChange,
  types,
  defaultTypeCode,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: CatalogType[];
  defaultTypeCode: string;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [typeCode, setTypeCode] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  /** Giá trị chọn: mặc định theo bộ lọc hiện tại, người dùng đổi sẽ ghi đè. */
  const effectiveTypeCode = typeCode || defaultTypeCode || types[0]?.code || "";

  const create = useMutation({
    mutationFn: () => createCatalogItem({ typeCode: effectiveTypeCode, code: code.trim(), name: name.trim() }),
    onSuccess: () => {
      toast({ title: "Đã tạo mục danh mục ✦" });
      setCode("");
      setName("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo mục thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const valid = effectiveTypeCode.length > 0 && code.trim().length > 0 && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo mục danh mục</DialogTitle>
          <DialogDescription>Mục mới sẽ ở trạng thái đang dùng, thứ tự 0.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Thuộc loại</Label>
            <Select value={effectiveTypeCode} onValueChange={setTypeCode}>
              <SelectTrigger className={triggerCls} aria-label="Chọn loại danh mục">
                <SelectValue placeholder="Chọn loại…" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.code}>
                    {t.name} ({t.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="item-code">Mã mục</Label>
              <Input id="item-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="vd: react" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-name">Tên mục</Label>
              <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="vd: React" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={!valid || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo mục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Sửa mục danh mục ───────────────────────── */

function EditCatalogItemDialog({
  item,
  onOpenChange,
  onChanged,
}: {
  item: CatalogItemEntry | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        {item ? <EditCatalogItemForm key={item.id} item={item} onOpenChange={onOpenChange} onChanged={onChanged} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditCatalogItemForm({
  item,
  onOpenChange,
  onChanged,
}: {
  item: CatalogItemEntry;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(item.name);
  const [value, setValue] = useState(item.value ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [isActive, setIsActive] = useState(item.isActive);

  const save = useMutation({
    mutationFn: () =>
      updateCatalogItem(item.id, {
        name: name.trim(),
        value: value.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      }),
    onSuccess: () => {
      toast({ title: "Đã lưu mục danh mục ✦" });
      onChanged();
      onOpenChange(false);
    },
    onError: (e) => toast({ title: "Lưu mục thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-ink">Sửa mục “{item.name}”</DialogTitle>
        <DialogDescription>
          Loại <span className="font-mono text-blue">{item.typeCode}</span> · mã{" "}
          <span className="font-mono text-blue">{item.code}</span>
        </DialogDescription>
      </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-item-name">Tên</Label>
            <Input id="edit-item-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-item-value">Giá trị</Label>
            <Input id="edit-item-value" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} placeholder="Giá trị tuỳ chọn…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-item-sort">Thứ tự hiển thị</Label>
              <Input id="edit-item-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} />
            </div>
            <div className="grid gap-1.5">
              <Label>Đang dùng</Label>
              <label className="flex h-11 items-center gap-3 rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 text-sm font-bold text-ink">
                <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Bật/tắt mục danh mục" />
                {isActive ? "Đang hiển thị" : "Đã tắt"}
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={name.trim().length === 0 || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
    </>
  );
}
