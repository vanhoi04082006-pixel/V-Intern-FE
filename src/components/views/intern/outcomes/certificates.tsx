"use client";

import * as React from "react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarCheck,
  CalendarRange,
  Copy,
  Fingerprint,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/client/router";
import { useSession } from "@/lib/client/session";
import { outcomeApi, type CertificateSummary } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { toast } from "sonner";
import { Stagger, StaggerItem, ViewFrame } from "@/components/shared/view";
import { PageHeader, Panel, ToneBadge } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { LogoMark } from "@/components/shared/logo";
import { BackButton } from "./parts";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function CertStatusBadge({ status }: { status: CertificateSummary["status"] }) {
  return status === "issued" ? (
    <ToneBadge tone="emerald" dot>
      Đã cấp
    </ToneBadge>
  ) : (
    <ToneBadge tone="rose" dot>
      Đã thu hồi
    </ToneBadge>
  );
}

/* ==================== LƯỚI CHỨNG CHỈ ==================== */

function CertificateCard({ certificate }: { certificate: CertificateSummary }) {
  return (
    <button
      type="button"
      onClick={() => navigate(`/intern/certificates/${certificate.id}`)}
      className="group block w-full rounded-3xl bg-gradient-to-br from-brand/50 via-teal/25 to-transparent p-[1px] text-left transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="noise relative h-full overflow-hidden rounded-[calc(1.5rem-1px)] bg-panel p-5">
        <LogoMark
          size={130}
          className="pointer-events-none absolute -right-9 -top-9 rotate-12 select-none opacity-[0.05]"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand/12 text-brand-bright">
              <Award className="size-5 icon" />
            </span>
            <CertStatusBadge status={certificate.status} />
          </div>
          <p className="mt-4 font-mono text-xs tracking-wider text-faint">
            {certificate.certificateNumber}
          </p>
          <h3 className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-ink">
            {certificate.projectName}
          </h3>
          <p className="mt-0.5 text-xs text-dim">{certificate.sessionName}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
            <CalendarCheck className="size-3.5 icon text-faint" />
            Cấp ngày {formatDate(certificate.issuedAt)}
          </p>
          <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-brand-bright opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Xem chứng chỉ
            <ArrowRight className="size-3.5 icon transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>
    </button>
  );
}

export function CertificatesView() {
  const res = useResource(() => outcomeApi.certificates());
  const items = res.data?.data ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kết quả & tăng trưởng"
        title="Chứng chỉ"
        description="Chứng nhận hoàn thành kỳ thực tập — mỗi chứng chỉ có mã tra cứu công khai dành cho nhà tuyển dụng."
      />

      {res.loading ? (
        <LoadingBlock rows={3} variant="cards" />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : items.length === 0 ? (
        <div className="card-surface">
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-dim">
              <Award className="size-5 icon" />
            </span>
            <p className="text-sm font-semibold text-ink">Chưa có chứng chỉ nào</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-dim">
              Hoàn thành kỳ thực tập với kết quả tốt để nhận chứng chỉ hoàn thành từ V-Intern.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              onClick={() => navigate("/intern/performance")}
            >
              Xem hiệu suất của tôi
            </Button>
          </div>
        </div>
      ) : (
        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((certificate) => (
            <StaggerItem key={certificate.id}>
              <CertificateCard certificate={certificate} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </ViewFrame>
  );
}

/* ==================== CHI TIẾT CHỨNG CHỈ ==================== */

function CertificateBoard({ params }: { params: Record<string, string> }) {
  const res = useResource(() => outcomeApi.certificate(params.id), [params.id]);
  const { user } = useSession();
  const certificate = res.data;

  const onCopy = async () => {
    if (!certificate) return;
    const ok = await copyText(certificate.verificationCode);
    if (ok) toast.success(`Đã sao chép mã tra cứu ${certificate.verificationCode}`);
    else toast.error("Không sao chép được — hãy chép thủ công.");
  };

  if (res.loading) return <LoadingBlock variant="detail" rows={6} />;
  if (res.error) return <ErrorBlock error={res.error} onRetry={res.reload} />;

  if (!certificate) {
    return (
      <div className="card-surface">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-dim">
            <Award className="size-5 icon" />
          </span>
          <p className="text-sm font-semibold text-ink">Không tìm thấy chứng chỉ</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={() => navigate("/intern/certificates")}
          >
            Về danh sách chứng chỉ
          </Button>
        </div>
      </div>
    );
  }

  const revoked = certificate.status === "revoked";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title={certificate.certificateNumber}
        description={certificate.sessionName}
        actions={<CertStatusBadge status={certificate.status} />}
      />

      <div
        className={cn(
          "rounded-3xl p-[1.5px]",
          revoked
            ? "bg-gradient-to-br from-rose/50 via-rose/20 to-transparent"
            : "glow-brand bg-gradient-to-br from-brand/60 via-teal/30 to-transparent"
        )}
      >
        <div className="noise relative overflow-hidden rounded-[calc(1.5rem-3px)] bg-panel px-6 py-10 text-center md:px-12">
          <LogoMark
            size={300}
            className="pointer-events-none absolute -right-24 -top-20 rotate-12 select-none opacity-[0.04]"
          />

          <div className="relative">
            <div className="flex justify-center">
              <LogoMark size={46} />
            </div>
            <p
              className={cn(
                "mt-5 text-[11px] font-semibold uppercase tracking-[0.32em]",
                revoked ? "text-rose" : "text-brand-bright"
              )}
            >
              Chứng nhận hoàn thành
            </p>

            {revoked ? (
              <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-rose/25 bg-rose/10 p-4 text-left">
                <ShieldX className="mt-0.5 size-5 shrink-0 icon text-rose" />
                <div>
                  <p className="text-sm font-semibold text-ink">Chứng chỉ đã bị thu hồi</p>
                  <p className="mt-1 text-xs leading-relaxed text-dim">
                    Chứng chỉ này không còn hiệu lực для tra cứu công khai
                    {certificate.revokedAt ? ` (thu hồi ngày ${formatDate(certificate.revokedAt)})` : ""}.
                  </p>
                </div>
              </div>
            ) : null}

            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-faint">Trao cho</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">
              {user?.displayName ?? "Bạn"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-dim">
              đã hoàn thành chương trình thực tập ảo
            </p>
            <p className="text-gradient mt-2 text-lg font-bold tracking-tight md:text-xl">
              {certificate.projectName}
            </p>
            <p className="mt-1 text-xs text-dim">{certificate.sessionName}</p>

            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-deep/50 p-3.5">
                <p className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                  <CalendarRange className="size-3.5 icon" />
                  Hoàn thành
                </p>
                <p className="mt-1.5 font-mono text-sm font-semibold text-ink">
                  {formatDate(certificate.completedAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-deep/50 p-3.5">
                <p className="flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                  <CalendarCheck className="size-3.5 icon" />
                  Ngày cấp
                </p>
                <p className="mt-1.5 font-mono text-sm font-semibold text-ink">
                  {formatDate(certificate.issuedAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-deep/60 px-3 py-1 font-mono text-[11px] font-semibold tracking-wider text-dim">
                <BadgeCheck className="size-3.5 icon text-brand-bright" />
                {certificate.policyCode}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-deep/60 px-3 py-1 font-mono text-[11px] tracking-wider text-dim">
                <Fingerprint className="size-3.5 icon text-faint" />
                {certificate.certificateNumber}
              </span>
            </div>
          </div>

          <div className="relative mt-9 border-t border-line pt-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
              Mã tra cứu công khai
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5">
              <code className="rounded-lg border border-brand/25 bg-brand/[0.07] px-4 py-2 font-mono text-base font-bold tracking-widest text-brand-bright">
                {certificate.verificationCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label="Sao chép mã tra cứu"
                className="size-10 rounded-lg border-line bg-panel-2 text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                onClick={onCopy}
              >
                <Copy className="size-4 icon" />
              </Button>
              <Button
                size="lg"
                className="h-10 rounded-lg bg-brand px-4 font-semibold text-on-brand hover:bg-brand-bright"
                onClick={() => navigate(`/verify?code=${encodeURIComponent(certificate.verificationCode)}`)}
              >
                <ShieldCheck className="size-4 icon" />
                Trang xác thực
              </Button>
            </div>
            <p className="mx-auto mt-3 max-w-sm text-[11px] leading-relaxed text-faint">
              Bất kỳ ai cũng có thể tra cứu chứng chỉ này bằng mã trên — kể cả khi chưa có tài khoản V-Intern.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificateDetailView({ params }: { params: Record<string, string> }) {
  return (
    <ViewFrame>
      <BackButton to="/intern/certificates" label="Tất cả chứng chỉ" />
      <CertificateBoard params={params} />
    </ViewFrame>
  );
}
