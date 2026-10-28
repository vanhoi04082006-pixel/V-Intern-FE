"use client";

import * as React from "react";
import { BadgeCheck, Fingerprint, ShieldCheck, ShieldX } from "lucide-react";
import { Link, useRoute } from "@/lib/client/router";
import { api } from "@/lib/client/http";
import { LogoMark } from "@/components/shared/logo";
import { LoadingBlock } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/primitives";
import { CenteredAuthLayout } from "./auth-layout";

interface VerifyResult {
  valid: boolean;
  certificateNumber?: string;
  holderName?: string;
  projectName?: string;
  sessionName?: string;
  issuedAt?: string;
  reason?: string;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line/60 py-3.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs text-faint">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function NoticeCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-8 text-center">
      <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-rose/10 text-rose">
        {icon}
      </span>
      <h1 className="text-lg font-bold tracking-tight text-ink">{title}</h1>
      <div className="mt-2 text-sm leading-relaxed text-dim">{children}</div>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
      >
        Về trang chủ
      </Link>
    </div>
  );
}

export function VerifyCertificatePage() {
  const { search } = useRoute();
  const code = search.get("code") ?? "";
  const [result, setResult] = React.useState<VerifyResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!code) {
      setError("Thiếu mã xác thực trong liên kết.");
      return;
    }
    api<VerifyResult>(`/certificates/verify/${encodeURIComponent(code)}`)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Không xác thực được."));
  }, [code]);

  return (
    <CenteredAuthLayout width="max-w-lg">
      {error ? (
        <NoticeCard icon={<ShieldX className="size-6 icon" />} title="Không xác thực được">
          {error}
        </NoticeCard>
      ) : !result ? (
        <LoadingBlock variant="detail" rows={3} />
      ) : result.valid ? (
        <ViewFrame>
          {/* Thẻ "giấy chứng nhận" — viền gradient brand */}
          <div className="rounded-3xl bg-gradient-to-br from-brand/50 via-teal/25 to-transparent p-[1px]">
            <div className="noise relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-panel p-7 md:p-8">
              {/* Watermark logo */}
              <LogoMark
                size={240}
                className="pointer-events-none absolute -right-16 -top-14 rotate-12 opacity-[0.05] select-none"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <span className="glow-brand mb-4 grid size-12 place-items-center rounded-2xl bg-brand/12 text-brand-bright">
                    <BadgeCheck className="size-6 icon" />
                  </span>
                  <h1 className="text-xl font-bold tracking-tight text-ink">
                    Chứng chỉ hợp lệ
                  </h1>
                  <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-dim">
                    <Fingerprint className="size-3.5 icon text-faint" />
                    Số hiệu {result.certificateNumber}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-bright">
                  <ShieldCheck className="size-3.5 icon" />
                  Đã xác thực
                </span>
              </div>

              <dl className="relative mt-6">
                <InfoRow label="Người sở hữu">{result.holderName}</InfoRow>
                <InfoRow label="Dự án">{result.projectName}</InfoRow>
                <InfoRow label="Buổi thực tập">{result.sessionName}</InfoRow>
                <InfoRow label="Cấp ngày">{result.issuedAt}</InfoRow>
              </dl>

              <p className="relative mt-6 flex items-center gap-2 border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
                <ShieldCheck className="size-3.5 shrink-0 icon text-brand-bright" />
                Xác thực bởi V-Intern — bất kỳ ai cũng có thể tra cứu công khai bằng mã này.
              </p>
            </div>
          </div>
        </ViewFrame>
      ) : (
        <NoticeCard icon={<ShieldX className="size-6 icon" />} title="Chứng chỉ không còn hiệu lực">
          {result.reason ?? "Chứng chỉ đã bị thu hồi."}
        </NoticeCard>
      )}
    </CenteredAuthLayout>
  );
}
