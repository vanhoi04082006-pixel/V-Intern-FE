/**
 * Vòng đời hàng đợi email mock: enqueue + lazy pending → sending → accepted.
 * (Template email nằm ở mail-templates.ts — tách riêng để seed không tạo vòng import.)
 */

import type { MailKind, MailRecord } from "./types";
import { getApplyStore } from "./store";
import { nowIso, randomId } from "../util";
import { maskEmail } from "./mail-templates";

export interface EnqueueMailInput {
  kind: MailKind;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  applicationId?: string | null;
  roundId?: string | null;
  availableAt?: string;
}

export function enqueueMail(input: EnqueueMailInput): MailRecord {
  const store = getApplyStore();
  const mail: MailRecord = {
    id: randomId("mail"),
    kind: input.kind,
    applicationId: input.applicationId ?? null,
    roundId: input.roundId ?? null,
    subject: input.subject,
    recipient: input.recipient,
    recipientHint: maskEmail(input.recipient),
    availableAt: input.availableAt ?? nowIso(),
    attempts: 0,
    status: "pending",
    lastCode: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastResentAt: null,
    html: input.html,
    text: input.text,
  };
  store.mailQueue.unshift(mail);
  return mail;
}

/**
 * Vòng đời mock: pending → sending (1.5s sau availableAt) → accepted (2.5s nữa).
 * Gọi trước khi đọc mail queue để FE poll thấy thư "sống".
 */
export function tickMailQueue(): void {
  const now = Date.now();
  for (const m of getApplyStore().mailQueue) {
    const t0 = new Date(m.availableAt).getTime();
    if (m.status === "pending" && now > t0 + 1500) {
      m.status = "sending";
      m.lastCode = "250 2.1.0 OK — queued by provider";
      m.updatedAt = nowIso();
    }
    if (m.status === "sending") {
      const since = m.lastResentAt ? new Date(m.lastResentAt).getTime() : t0;
      if (now > since + 2500) {
        m.status = "accepted";
        m.lastCode = "250 2.0.0 OK — accepted by provider";
        m.updatedAt = nowIso();
      }
    }
  }
}
