import { createHash } from "node:crypto";

export const severityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function finding(input) {
  const ruleId = input.ruleId || "unspecified";
  const location = input.location || "unknown";
  const fingerprint = hash(`${ruleId}\0${location}`).slice(0, 24);
  const evidenceHash = hash(JSON.stringify({
    severity: input.severity,
    evidence: input.evidence || "",
    details: input.details || [],
  })).slice(0, 24);
  return {
    fingerprint,
    evidenceHash,
    ruleId,
    severity: input.severity || "P3",
    category: input.category || "一般异常",
    title: input.title,
    location,
    evidence: input.evidence || "",
    details: input.details || [],
    impact: input.impact || "可能影响网站可用性或内容正确性。",
    remediation: input.remediation || "核对证据后修复并重新运行检查。",
    confidence: input.confidence || "HIGH",
    verification: input.verification || "CONFIRMED",
    source: input.source || "web",
  };
}

export function sortFindings(findings) {
  return [...findings].sort((left, right) =>
    severityOrder[left.severity] - severityOrder[right.severity]
    || left.category.localeCompare(right.category)
    || left.location.localeCompare(right.location));
}

export function countsFor(findings) {
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const item of findings) if (item.verification !== "CANDIDATE") counts[item.severity] += 1;
  return counts;
}

export function candidateCountsFor(findings) {
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const item of findings) if (item.verification === "CANDIDATE") counts[item.severity] += 1;
  return counts;
}

export function parseExpectedRevision(value) {
  if (value === undefined || value === null || value === "") return null;
  const revision = Number(value);
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("expected revision 必须是正整数。");
  return revision;
}

export function decisionFor(findings, stages, observation) {
  if (stages.some((stage) => stage.required && stage.status !== "completed")) return "INCOMPLETE";
  if (observation) return "OBSERVATION";
  if (findings.some((item) => item.verification === "CONFIRMED" && item.severity === "P0")) return "BLOCKED_P0";
  if (findings.some((item) => item.verification === "CONFIRMED" && item.severity === "P1")) return "ACTION_REQUIRED_P1";
  return "PASS";
}
