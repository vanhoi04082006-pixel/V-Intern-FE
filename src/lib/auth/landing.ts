import { getWorkspace, lifecyclePath } from "@/lib/api/workspace";
import { getWorkspacePathForUser } from "./role-landing";
import type { SessionUser } from "./session";
export async function resolveLoginLanding(user: SessionUser): Promise<string> {
  if (user.mustChangePassword) return '/change-password';
  const path = getWorkspacePathForUser(user);
  return path === "/intern" ? lifecyclePath(await getWorkspace()) : path;
}
