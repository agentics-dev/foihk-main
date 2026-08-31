import { supabase } from "@/integrations/supabase/client";

export type SiteDeployStatus = {
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
  return data.deploy as SiteDeployStatus;
};
