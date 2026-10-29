"use client";

/**
 * Cấu hình hệ thống — danh sách cài đặt dạng khóa/giá trị, sửa trực tiếp
 * từng dòng và lưu riêng lẻ.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Save, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchSettings, updateSetting, type SettingItem } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AdminSettingsView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: ({ signal }) => fetchSettings(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Toàn bộ cài đặt vận hành của hệ thống — hiển thị dưới dạng khóa/giá trị."
      />

      <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-400/60 bg-amber-50/70 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-extrabold text-amber-800">Chỉnh sửa cẩn thận — ảnh hưởng toàn hệ thống</p>
          <p className="mt-1 text-[13px] leading-relaxed text-amber-700">
            Giá trị sai có thể làm gián đoạn đăng nhập, gửi email hoặc tính toán KPI. Chỉ thay đổi khi chắc chắn ý nghĩa của khóa.
          </p>
        </div>
      </div>

      <SectionCard title="Danh sách cài đặt" description="Sửa giá trị rồi bấm “Lưu” ở từng dòng.">
        {isLoading ? (
          <LoadingState label="Đang tải cấu hình…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Chưa có cài đặt nào" description="Hệ thống chưa cấu hình khóa nào." />
        ) : (
          <ul className="space-y-3">
            {data.map((item) => (
              <SettingRow key={item.key} item={item} />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function SettingRow({ item }: { item: SettingItem }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [value, setValue] = useState(item.value);

  const save = useMutation({
    mutationFn: () => updateSetting({ key: item.key, value }),
    onSuccess: () => {
      toast({ title: "Đã lưu cấu hình ✦", description: `${item.key} = ${value}` });
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) => toast({ title: "Lưu cấu hình thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const dirty = value !== item.value;

  return (
    <li className="rounded-2xl border-2 border-ink/10 bg-paper-raised p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 lg:w-[320px]">
          <p className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-blue">
            <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {item.key}
          </p>
          {item.description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{item.description}</p>
          ) : null}
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputCls}
            aria-label={`Giá trị của ${item.key}`}
          />
          <Button
            variant="outline"
            className="h-11 shrink-0 gap-1.5 rounded-xl border-2 border-ink/20 font-bold disabled:opacity-50"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {save.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </div>
    </li>
  );
}
