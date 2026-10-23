import { useSyncExternalStore } from 'react';
import { getSessionUser, subscribeSession } from '@/lib/auth/session';
import { hasAllPermissions, hasRole } from '@/lib/auth/permissions';

const serverSnapshot = () => null;
export function useKnowledgeAccess() {
  const user = useSyncExternalStore(subscribeSession, getSessionUser, serverSnapshot);
  const read = hasRole(user, 'admin') && hasAllPermissions(user, ['knowledge.read']);
  return { read, manage: read && hasAllPermissions(user, ['knowledge.manage']), publish: read && hasAllPermissions(user, ['knowledge.publish']) };
}
