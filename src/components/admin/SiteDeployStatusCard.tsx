import { AlertCircle, CheckCircle2, Clock3, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticleSyncLabel, type SiteDeployStatus } from "@/lib/siteDeploy";

interface SiteDeployStatusCardProps {
  deploy: SiteDeployStatus | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  onRefresh: () => void;
  onAction: (action: "retry" | "rebuild") => void;
}

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleString("en-HK", { dateStyle: "medium", timeStyle: "medium" })
  : "—";

const statusPresentation = {
  queued: { label: "Queued", icon: Clock3, variant: "secondary" as const },
  building: { label: "Building", icon: Loader2, variant: "secondary" as const },
  live: { label: "Live", icon: CheckCircle2, variant: "default" as const },
  failed: { label: "Failed", icon: AlertCircle, variant: "destructive" as const },
};

export const SiteDeployStatusCard = ({
  deploy,
  loading,
  error,
  actionLoading,
  onRefresh,
  onAction,
}: SiteDeployStatusCardProps) => {
  const presentation = deploy && !error ? statusPresentation[deploy.status] : null;
  const StatusIcon = presentation?.icon;
  return (
    <Card className={deploy?.status === "failed" ? "border-destructive" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Static page synchronization</CardTitle>
            <CardDescription>
              Database changes are rebuilt, verified in raw production HTML, then submitted to IndexNow.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {presentation && StatusIcon && (
              <Badge variant={presentation.variant} className="gap-1.5">
                <StatusIcon className={`h-3.5 w-3.5 ${deploy?.status === "building" ? "animate-spin" : ""}`} />
                {getArticleSyncLabel(deploy)}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading || actionLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!presentation && <Badge variant="secondary">Sync unavailable</Badge>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {deploy && (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-muted-foreground">Target revision</dt><dd className="font-medium">{deploy.desiredRevision}</dd></div>
              <div><dt className="text-muted-foreground">Verified revision</dt><dd className="font-medium">{deploy.deployedRevision}</dd></div>
              <div><dt className="text-muted-foreground">Pending URLs</dt><dd className="font-medium">{deploy.pendingUrlCount}</dd></div>
              <div><dt className="text-muted-foreground">IndexNow pending</dt><dd className="font-medium">{deploy.indexNowPendingCount}</dd></div>
              <div><dt className="text-muted-foreground">Last content change</dt><dd>{formatDate(deploy.lastChangeAt)}</dd></div>
              <div><dt className="text-muted-foreground">Deployment triggered</dt><dd>{formatDate(deploy.triggeredAt)}</dd></div>
              <div><dt className="text-muted-foreground">Production verified</dt><dd>{formatDate(deploy.verifiedAt)}</dd></div>
              <div><dt className="text-muted-foreground">Attempt</dt><dd>{deploy.attemptCount} / 3</dd></div>
            </dl>
            {deploy.lastError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {deploy.lastError}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {deploy.status === "failed" ? (
                <Button size="sm" onClick={() => onAction("retry")} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Retry rebuild
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onAction("rebuild")} disabled={actionLoading || deploy.status === "building"}>
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Rebuild current content
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
