import type { SeoScoreResult } from "@/lib/seoScore";
import { cn } from "@/lib/utils";

export const SeoHealthScore = ({ result }: { result: SeoScoreResult }) => {
  const { score, items } = result;
  const colorClass = score < 60 ? "text-red-600" : score < 80 ? "text-amber-600" : "text-emerald-600";
  const strokeColor = score < 60 ? "stroke-red-500" : score < 80 ? "stroke-amber-500" : "stroke-emerald-500";
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const failed = items.filter((item) => !item.passed);

  return (
    <section aria-label="SEO health score" className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
            <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * circumference} ${circumference}`} className={cn("transition-all", strokeColor)} />
          </svg>
          <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums", colorClass)}>{score}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">SEO health score</p>
          <p className={cn("text-2xl font-bold tabular-nums", colorClass)}>{score} <span className="text-sm font-normal text-muted-foreground">/ 100</span></p>
        </div>
      </div>
      {failed.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
          {failed.map((item) => <li key={item.key} className="break-words text-xs text-muted-foreground"><span className="font-medium text-foreground">{item.label} ({item.max} pts):</span> {item.suggestion}</li>)}
        </ul>
      ) : (
        <p className="mt-4 border-t border-border pt-3 text-xs text-emerald-700">All SEO checks passed for this language.</p>
      )}
    </section>
  );
};
