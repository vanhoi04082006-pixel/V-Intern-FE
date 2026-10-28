/** GitHub connect (đủ 3 role). */

import { normalizeText } from "../util";
import { route, type RouteDef, type Ctx } from "./common";

function defaultGithub(userId: string) {
  return { userId, configured: true, connected: false, login: null };
}

function githubOf(ctx: Ctx) {
  const userId = ctx.user!.id;
  if (!ctx.store.github[userId]) ctx.store.github[userId] = defaultGithub(userId);
  return ctx.store.github[userId];
}

async function myGithub(ctx: Ctx): Promise<unknown> {
  const g = githubOf(ctx);
  return {
    configured: g.configured,
    connected: g.connected,
    login: g.login,
    canCreatePublicRepo: g.configured,
  };
}

async function connectGithub(ctx: Ctx): Promise<unknown> {
  const g = githubOf(ctx);
  const login = `${normalizeText(ctx.user!.displayName).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-vintern`;
  g.connected = true;
  g.login = login;
  const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=vintern-demo&redirect_uri=${encodeURIComponent(
    "https://vintern.edu.vn/api/github/callback"
  )}&scope=repo%20read:user&state=${encodeURIComponent(login)}`;
  return { authorizeUrl, connected: true, login };
}

async function disconnectGithub(ctx: Ctx): Promise<unknown> {
  const g = githubOf(ctx);
  g.connected = false;
  g.login = null;
  return { ok: true, connected: false, login: null };
}

export const githubRoutes: RouteDef[] = [
  route("GET", "/github/me", "user", myGithub),
  route("POST", "/github/connect", "user", connectGithub),
  route("DELETE", "/github/me", "user", disconnectGithub),
];
