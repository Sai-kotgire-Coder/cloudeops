// A user counts as "active" if their last known activity (GameState's
// updatedAt, which changes whenever their simulation state is saved) falls
// within this window. Used by the admin dashboard's active/inactive
// counts and the "inactive" broadcast target filter.
export const ACTIVE_WINDOW_DAYS = 14;

export function isActive(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return lastActiveAt.getTime() > Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}
