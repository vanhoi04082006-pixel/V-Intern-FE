import { request } from "./client";
import * as p from "./parse";
const path = (round: string, id: string) =>
  `/recruitment-rounds/${encodeURIComponent(round)}/applications/${encodeURIComponent(id)}`;
export const previewCredentialRecovery = (
  round: string,
  id: string,
  slotId: string,
) =>
  request(
    `${path(round, id)}/credential-recovery?slotId=${encodeURIComponent(slotId)}`,
    (raw) => {
      const r = p.record(raw);
      return {
        allowed: p.boolean(r.allowed),
        message: p.string(r.message),
        revision: p.nullable(r.revision, p.string),
        expiresAt: p.nullable(r.expiresAt, p.string),
      };
    },
  );
export const recoverApplicationCredentials = (
  round: string,
  id: string,
  input: { slotId: string; expectedRevision: string; reason: string },
) =>
  request(
    `${path(round, id)}/recover-credentials`,
    (raw) => {
      const r = p.record(raw);
      return {
        recovered: p.boolean(r.recovered),
        duplicate: p.boolean(r.duplicate),
        mailId: p.string(r.mailId),
      };
    },
    { method: "POST", body: input },
  );
