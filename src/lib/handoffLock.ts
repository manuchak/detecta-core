/**
 * Module-level lock to prevent OrphanGuard/BalanceGuard from
 * interfering with services during a shift handoff.
 */
const handoffInProgress = new Set<string>();

export function lockServices(serviceIds: string[]) {
  for (const id of serviceIds) handoffInProgress.add(id);
}

export function unlockAllServices() {
  handoffInProgress.clear();
}

export function isServiceLocked(serviceId: string): boolean {
  return handoffInProgress.has(serviceId);
}

export function getLockedServices(): ReadonlySet<string> {
  return handoffInProgress;
}
