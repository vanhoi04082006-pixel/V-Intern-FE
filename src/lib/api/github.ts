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
