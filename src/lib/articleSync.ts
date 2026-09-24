export type SyncStatus = {
  status: "queued" | "building" | "live" | "failed";
  desiredRevision: number; deployedRevision: number; verifiedAt: string | null;
  pendingArticleIds: string[]; receivedAt?: number;
};
export const getArticleSyncLabel = (state: SyncStatus | null, articleId?: string, now = Date.now()) => {
  if (!state || !state.receivedAt || now - state.receivedAt > 60000
    || !Number.isSafeInteger(state.desiredRevision) || state.desiredRevision < 1
    || !Number.isSafeInteger(state.deployedRevision) || state.deployedRevision < 0
    || state.deployedRevision > state.desiredRevision) return "Sync unavailable";
  const pending = articleId ? state.pendingArticleIds.includes(articleId) : state.deployedRevision < state.desiredRevision;
  if (pending || state.deployedRevision < 1) return state.status === "failed" ? "Sync failed"
    : state.status === "building" ? "Syncing" : "Sync pending";
  return state.verifiedAt && Number.isFinite(Date.parse(state.verifiedAt)) ? "Sync verified" : "Sync unavailable";
};
