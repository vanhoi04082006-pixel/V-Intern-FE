import { request } from './client';
import * as p from './parse';
export const mailStatuses = ['pending', 'sending', 'accepted', 'delivered', 'bounced', 'uncertain', 'dead', 'cancelled', 'expired'] as const;
export const parseMail = (raw: unknown) => {
  const r = p.record(raw);
  return { id: p.string(r.id), kind: p.string(r.kind), recipientHint: p.string(r.recipientHint), status: p.oneOf(r.status, mailStatuses), attempts: p.number(r.attempts), availableAt: p.string(r.availableAt), expiresAt: p.string(r.expiresAt), lastCode: p.nullable(r.lastCode, p.string), createdAt: p.string(r.createdAt) };
};
export const listMail = (page: number, signal?: AbortSignal) => request(`/admin/communications?page=${page}`, raw => {
  const r = p.record(raw); return { items: p.array(r.items, parseMail), total: p.number(r.total), page: p.number(r.page), pageSize: p.number(r.pageSize), transportConfigured: p.boolean(r.transportConfigured), deliveryMode: p.oneOf(r.deliveryMode ?? 'smtp', ['local', 'smtp'] as const) };
}, { signal });
export const previewMail = (id: string) => request(`/admin/communications/${encodeURIComponent(id)}/preview`, raw => {
  const r = p.record(raw); return p.boolean(r.redacted) ? { redacted: true as const, message: p.string(r.message) } : { redacted: false as const, subject: p.string(r.subject), text: p.string(r.text), html: p.string(r.html) };
});
export const resendMail = (id: string, acknowledgeUncertain: boolean) => request(`/admin/communications/${encodeURIComponent(id)}/resend`, raw => p.boolean(p.record(raw).queued), { method: 'POST', body: { acknowledgeUncertain } });
