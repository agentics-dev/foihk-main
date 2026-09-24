import fs from "node:fs/promises";
import { severityOrder } from "./model.mjs";

export function compareRuns(current, baseline) {
  const previous = new Map((baseline?.findings || []).map((item) => [item.fingerprint, item]));
  const present = new Map((current?.findings || []).map((item) => [item.fingerprint, item]));
  const newFindings = [];
  const ongoing = [];
  const worsened = [];
  const resolved = [];
  for (const item of current.findings || []) {
    const old = previous.get(item.fingerprint);
    if (!old) newFindings.push(item);
    else if (severityOrder[item.severity] < severityOrder[old.severity] || item.evidenceHash !== old.evidenceHash) worsened.push({ ...item, previousSeverity: old.severity, previousEvidenceHash: old.evidenceHash });
    else ongoing.push(item);
  }
  for (const item of baseline?.findings || []) if (!present.has(item.fingerprint)) resolved.push(item);
  return {
    siteId: current.siteId,
    currentRunId: current.runId,
    baselineRunId: baseline?.runId || null,
    generatedAt: new Date().toISOString(),
    new: newFindings,
    worsened,
    ongoing,
    resolved,
    changed: newFindings.length + worsened.length + resolved.length > 0,
  };
}

export async function compareRunFiles(currentPath, baselinePath, outputPath) {
  const [current, baseline] = await Promise.all([
    fs.readFile(currentPath, "utf8").then(JSON.parse),
    fs.readFile(baselinePath, "utf8").then(JSON.parse),
  ]);
  const result = compareRuns(current, baseline);
  if (outputPath) await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
