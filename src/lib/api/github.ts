import { request } from "./client";
import * as p from "./parse";
export const githubStatus = (signal?: AbortSignal) =>
  request(
    "/github/me",
    (value) => {
      const v = p.record(value);
      return {
        configured: p.boolean(v.configured),
        connected: p.boolean(v.connected),
        login: p.nullable(v.login, p.string),
        canCreatePublicRepo: p.boolean(v.canCreatePublicRepo),
        reconnectRequired: p.boolean(v.reconnectRequired),
      };
    },
    { signal },
  );
export const connectGithub = () =>
  request(
    "/github/connect",
    (value) => {
      const url = p.string(p.record(value).authorizeUrl),
        u = new URL(url);
      if (
        u.origin !== "https://github.com" ||
        u.pathname !== "/login/oauth/authorize" ||
        u.username ||
        u.password
      )
        throw new Error("GitHub authorization URL không hợp lệ.");
      return url;
    },
    { method: "POST" },
  );
export const disconnectGithub = () =>
  request("/github/me", p.record, { method: "DELETE" });
function parseRepository(value: unknown) {
  const v = p.record(value);
  return {
    repository: p.nullable(v.repository, (item) => {
      const r = p.record(item);
      return {
        owner: p.string(r.owner),
        name: p.string(r.name),
        url: p.nullable(r.url, p.string),
        status: p.oneOf(r.status, ["provisioning", "ready", "failed"]),
        errorCode: p.nullable(r.errorCode, p.string),
        webhookStatus: r.webhookStatus === undefined ? 'not_configured' : p.oneOf(r.webhookStatus, ['not_configured', 'configuring', 'ready', 'failed']),
        webhookUpdatedAt: p.nullable(r.webhookUpdatedAt ?? null, p.string),
      };
    }),
    members: p.array(v.members, (item) => {
      const r = p.record(item);
      return { userId: p.string(r.userId), status: p.string(r.status) };
    }),
  };
}
export const sessionRepository = (id: string, signal?: AbortSignal) =>
  request(`/sessions/${id}/github`, parseRepository, { signal });
export const provisionRepository = (id: string) =>
  request(`/sessions/${id}/github/provision`, parseRepository, {
    method: "POST",
  });
export const inviteRepositoryMembers = (id: string) =>
  request(`/sessions/${id}/github/invite`, p.record, { method: "POST" });
export const configureGithubWebhook = (id: string) => request(`/sessions/${encodeURIComponent(id)}/github/webhook`, parseRepository, { method: 'POST' });
export const githubRepositoryActivity = (id: string, page: number, signal?: AbortSignal) => request(`/sessions/${encodeURIComponent(id)}/github/activity?page=${page}&pageSize=5`, value => {
  const v = p.record(value);
  return { total: p.number(v.total), items: p.array(v.items, item => {
    const e = p.record(item);
    return { id: p.string(e.id), eventType: p.string(e.eventType), action: p.string(e.action), headSha: p.nullable(e.headSha, p.string), pullNumber: p.nullable(e.pullNumber, p.number), branch: p.nullable(e.branch, p.string), receivedAt: p.string(e.receivedAt) };
  }) };
}, { signal });
