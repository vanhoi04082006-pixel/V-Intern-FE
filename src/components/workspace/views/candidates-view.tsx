"use client";

/**
 * Ứng viên tuyển dụng (staff) — danh sách ứng viên, tình trạng đủ điều kiện
 * phỏng vấn AI và điểm gần nhất.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { fetchCandidates, fetchCareerRoleCatalog } from "@/lib/api/recruitment";
import { errorMessage } from "@/lib/api/transport";
import {
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function CandidatesView() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["candidates", search, role, page],
    queryFn: ({ signal }) =>
      fetchCandidates({ search: search.trim() || undefined, role: role === "all" ? undefined : role, page }, signal),
  });

  const { data: roles } = useQuery({
    queryKey: ["career-roles"],
    queryFn: ({ signal }) => fetchCareerRoleCatalog(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ứng viên"
        description="Theo dõi ứng viên của các đợt tuyển dụng — vai trò ứng tuyển, tình trạng đủ điều kiện phỏng vấn AI và kết quả gần nhất."
      />

      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên hoặc email ứng viên…"
              className={`${INPUT_CLS} pl-10`}
            />
          </div>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${INPUT_CLS} w-full sm:w-[220px]`}>
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi vai trò</SelectItem>
              {(roles ?? []).map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách ứng viên…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có ứng viên nào"
              description="Ứng viên nộp CV qua cổng công khai sẽ xuất hiện tại đây."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(c) => c.userId}
                emptyTitle="Không tìm thấy ứng viên phù hợp"
                emptyDescription="Thử đổi từ khoá hoặc vai trò."
                columns={[
                  { key: "name", header: "Họ tên", render: (c) => <span className="font-bold">{c.displayName}</span> },
                  { key: "email", header: "Email", render: (c) => <span className="text-ink-soft">{c.email}</span> },
                  {
                    key: "role",
                    header: "Vai trò ứng tuyển",
                    render: (c) => {
                      const r = (roles ?? []).find((x) => x.code === c.role);
                      return c.role ? r?.name ?? c.role : "—";
                    },
                  },
                  { key: "eligibility", header: "Tình trạng", render: (c) => <StatusBadge status={c.eligibility} /> },
                  { key: "attempts", header: "Số lượt", render: (c) => `${c.attempts}` },
                  {
                    key: "score",
                    header: "Điểm gần nhất",
                    render: (c) => (c.latestScore != null ? <span className="font-bold">{c.latestScore.toFixed(1)}</span> : "—"),
                  },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
