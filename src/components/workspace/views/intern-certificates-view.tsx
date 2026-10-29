"use client";

/**
 * Chứng nhận — chứng chỉ hoàn thành lộ trình thực tập, tải PDF và trạng thái thu hồi.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { Award, Download, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchMyCertificates, type MyCertificate } from "@/lib/api/intern";
import { downloadMyCertificatePdf } from "@/lib/api/finance";
import { errorMessage } from "@/lib/api/transport";
import { saveBlob, fmtDate } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";

function CertificateCard({ certificate }: { certificate: MyCertificate }) {
  const { toast } = useToast();
  const revoked = certificate.status === "revoked";

  const download = useMutation({
    mutationFn: async () => {
      const blob = await downloadMyCertificatePdf(certificate.id);
      saveBlob(blob, `${certificate.certificateNumber}.pdf`);
    },
    onSuccess: () => {
      toast({ title: "Đang tải chứng nhận ✦", description: "Mở thư mục Download để xem file nhé!" });
    },
    onError: (e) =>
      toast({ title: "Chưa tải được PDF", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <SectionCard className={revoked ? "opacity-80" : undefined}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-blue/30 bg-blue-mist p-1.5 text-blue">
              <Award className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="font-mono text-sm font-extrabold tracking-wide text-ink">
              {certificate.certificateNumber}
            </p>
            <StatusBadge status={certificate.status} />
          </div>
          <p className="text-[13px] font-bold text-ink-soft">
            Đồ án: {certificate.projectName ?? "—"}
          </p>
          <p className="font-mono text-[11px] text-ink-faint">
            Cấp ngày {fmtDate(certificate.issuedAt)}
          </p>

          {revoked ? (
            <div className="rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/70 p-3 text-[13px] leading-relaxed text-rose-700">
              <p className="flex items-center gap-1.5 font-extrabold">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Chứng nhận đã bị thu hồi
              </p>
              {certificate.revokeReason ? <p className="mt-1">Lý do: {certificate.revokeReason}</p> : null}
              {certificate.revokedAt ? (
                <p className="mt-1 font-mono text-[11px]">Thu hồi ngày {fmtDate(certificate.revokedAt)}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        {!revoked ? (
          <Button
            variant="outline"
            className="h-11 shrink-0 gap-2"
            disabled={download.isPending}
            onClick={() => download.mutate()}
          >
            {download.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            Tải PDF
          </Button>
        ) : null}
      </div>
    </SectionCard>
  );
}

export function InternCertificatesView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-certificates"],
    queryFn: ({ signal }) => fetchMyCertificates(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chứng nhận"
        description="Chứng chỉ hoàn thành lộ trình thực tập — tải về và khoe với mọi người nhé!"
      />

      {isLoading ? (
        <LoadingState label="Đang tải chứng nhận…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Hoàn thành lộ trình để nhận chứng nhận!"
          description="Chứng nhận sẽ được cấp khi bạn hoàn thành đồ án với kết quả tốt. Cố lên nhé!"
        />
      ) : (
        <>
          {data.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <Award className="h-4 w-4" aria-hidden="true" />
            mỗi chứng chỉ là một dấu mốc — nhớ lưu file cẩn thận nhé ✦
          </p>
        </>
      )}
    </div>
  );
}
