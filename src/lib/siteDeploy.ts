import { supabase } from "@/integrations/supabase/client";

export type SiteDeployStatus = {
  receivedAt: number;
  status: "queued" | "building" | "live" | "failed";
  desiredRevision: number;
  activeRevision: number | null;
  deployedRevision: number;
  lastChangeAt: string | null;
  triggeredAt: string | null;
  verifiedAt: string | null;
  attemptCount: number;
  nextRetryAt: string | null;
  lastError: string | null;
  pendingUrlCount: number;
  pendingArticleIds: string[];
  indexNowPendingCount: number;
};

type DeployAction = "status" | "retry" | "rebuild";

export const requestSiteDeployStatus = async (action: DeployAction = "status") => {
  const { data, error } = await supabase.functions.invoke("site-deploy-admin", {
    body: { action },
  });
  if (error) throw error;
  if (!data?.deploy) throw new Error("Deployment status is unavailable");
  const deploy = data.deploy;
  if (!["queued", "building", "live", "failed"].includes(deploy.status)
    || !Array.isArray(deploy.pendingArticleIds) || !Number.isSafeInteger(deploy.desiredRevision)
    || !Number.isSafeInteger(deploy.deployedRevision)) throw new Error("Invalid deployment status");
  return { ...deploy, receivedAt: Date.now() } as SiteDeployStatus;
};

export { getArticleSyncLabel } from "./articleSync";
