import fs from "node:fs/promises";
import { finding, sortFindings } from "./model.mjs";

const apiBase = "https://api.github.com";
const marker = (fingerprint) => `<!-- website-anomaly:fingerprint=${fingerprint} -->`;
const stateMarker = "<!-- website-anomaly-state:v1 -->";

async function githubRequest(pathname, token, options = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

function parseFingerprint(body = "") {
  return body.match(/<!-- website-anomaly:fingerprint=([a-f0-9]{24}) -->/)?.[1] || null;
}

function parseState(body = "") {
  const encoded = body.match(/```json\n([\s\S]*?)\n```/)?.[1];
  if (!encoded) return null;
  try { return JSON.parse(encoded); } catch { return null; }
}

function issueBody(item, run, runUrl) {
  return `${marker(item.fingerprint)}\n\n## ${item.title}\n\n- 严重度：${item.severity}\n- 分类：${item.category}\n- 状态：${item.verification === "CONFIRMED" ? "已确认" : "待核实"}\n- 位置：${item.location}\n- 证据：${item.evidence || "无"}\n- 影响：${item.impact}\n- 建议：${item.remediation}\n- 证据哈希：${item.evidenceHash}\n- 站点：${run.siteId}\n- 源码 commit：${run.sourceCommit || "unknown"}\n- 内容 revision：${run.contentRevision ?? "unknown"}\n${runUrl ? `- 巡检运行：[查看 GitHub Actions](${runUrl})\n` : ""}\n> 自动巡检只执行只读检查；请人工确认后再修复。`;
}

export function planIssueActions(activeFindings, issues) {
  const byFingerprint = new Map(issues.filter((issue) => !issue.pull_request).map((issue) => [parseFingerprint(issue.body), issue]).filter(([key]) => key));
  const activeFingerprints = new Set(activeFindings.map((item) => item.fingerprint));
  const create = [];
  const update = [];
  const reopen = [];
  const unchanged = [];
  const resolve = [];
  for (const item of activeFindings) {
    const issue = byFingerprint.get(item.fingerprint);
    if (!issue) create.push({ item });
    else if (issue.state === "closed") reopen.push({ item, issue });
    else if (!issue.body?.includes(`证据哈希：${item.evidenceHash}`) || issue.title !== `[${item.severity}] ${item.title}`) update.push({ item, issue });
    else unchanged.push({ item, issue });
  }
  for (const [fingerprint, issue] of byFingerprint) if (issue.state === "open" && !activeFingerprints.has(fingerprint)) resolve.push({ fingerprint, issue });
  return { create, update, reopen, unchanged, resolve };
}

async function ensureLabel(repo, token, name, color, description) {
  try {
    await githubRequest(`/repos/${repo}/labels/${encodeURIComponent(name)}`, token);
  } catch {
    await githubRequest(`/repos/${repo}/labels`, token, { method: "POST", body: JSON.stringify({ name, color, description }) });
  }
}

export async function syncGithubIssues({ runPath, repo, token, runUrl }) {
  if (!token) throw new Error("缺少 GITHUB_TOKEN，无法同步异常 Issue。");
  const run = JSON.parse(await fs.readFile(runPath, "utf8"));
  const issueLabel = run.github?.issueLabel || "website-anomaly";
  const stateLabel = run.github?.stateLabel || "website-anomaly-state";
  await ensureLabel(repo, token, issueLabel, "b60205", "网站自主巡检发现");
  await ensureLabel(repo, token, stateLabel, "6f42c1", "网站自主巡检内部状态");
  const issues = await githubRequest(`/repos/${repo}/issues?state=all&per_page=100&labels=${encodeURIComponent(issueLabel)}`, token);
  const stateIssues = await githubRequest(`/repos/${repo}/issues?state=all&per_page=10&labels=${encodeURIComponent(stateLabel)}`, token);
  const stateIssue = stateIssues.find((issue) => !issue.pull_request);
  const previousState = parseState(stateIssue?.body) || { surfaces: {} };
  const previousSurfaces = previousState.surfaces || {};
  const surfaceCandidates = [];
  for (const surface of run.surfaces || []) {
    const key = `${surface.url}|${surface.viewport || "http"}`;
    if (previousSurfaces[key] && previousSurfaces[key] !== surface.signature) {
      surfaceCandidates.push(finding({ ruleId: `surface-change:${surface.viewport || "http"}`, severity: "P3", category: "未知异常候选", title: "页面结构或资源基线发生变化", location: surface.url, evidence: `${surface.viewport || "HTTP"} 基线签名已变化`, impact: "这可能是正常发布，也可能是未覆盖的页面退化。", remediation: "对照本次截图和上一版页面，确认变化符合预期。", confidence: "LOW", verification: "CANDIDATE", source: "baseline" }));
    }
  }
  const activeFindings = sortFindings([...(run.findings || []), ...surfaceCandidates]);
  const plan = planIssueActions(activeFindings, issues);
  const events = { created: 0, updated: 0, reopened: 0, resolved: 0, unchanged: 0 };
  for (const { item } of plan.create) {
    const body = issueBody(item, run, runUrl);
    const title = `[${item.severity}] ${item.title}`;
    await githubRequest(`/repos/${repo}/issues`, token, { method: "POST", body: JSON.stringify({ title, body, labels: [issueLabel] }) });
    events.created += 1;
  }
  for (const { item, issue } of plan.reopen) {
    await githubRequest(`/repos/${repo}/issues/${issue.number}`, token, { method: "PATCH", body: JSON.stringify({ state: "open", title: `[${item.severity}] ${item.title}`, body: issueBody(item, run, runUrl) }) });
    await githubRequest(`/repos/${repo}/issues/${issue.number}/comments`, token, { method: "POST", body: JSON.stringify({ body: `问题在 ${run.completedAt} 再次出现。${runUrl ? ` [查看运行](${runUrl})` : ""}` }) });
    events.reopened += 1;
  }
  for (const { item, issue } of plan.update) {
    await githubRequest(`/repos/${repo}/issues/${issue.number}`, token, { method: "PATCH", body: JSON.stringify({ title: `[${item.severity}] ${item.title}`, body: issueBody(item, run, runUrl) }) });
    await githubRequest(`/repos/${repo}/issues/${issue.number}/comments`, token, { method: "POST", body: JSON.stringify({ body: `证据或严重度在 ${run.completedAt} 发生变化。${runUrl ? ` [查看运行](${runUrl})` : ""}` }) });
    events.updated += 1;
  }
  events.unchanged = plan.unchanged.length;
  for (const { issue } of plan.resolve) {
    await githubRequest(`/repos/${repo}/issues/${issue.number}`, token, { method: "PATCH", body: JSON.stringify({ state: "closed", state_reason: "completed" }) });
    await githubRequest(`/repos/${repo}/issues/${issue.number}/comments`, token, { method: "POST", body: JSON.stringify({ body: `自动巡检在 ${run.completedAt} 未再复现该问题，已记录为恢复。${runUrl ? ` [查看运行](${runUrl})` : ""}` }) });
    events.resolved += 1;
  }
  const nextState = {
    runId: run.runId,
    completedAt: run.completedAt,
    surfaces: Object.fromEntries((run.surfaces || []).map((surface) => [`${surface.url}|${surface.viewport || "http"}`, surface.signature])),
  };
  const stateBody = `${stateMarker}\n\n此 Issue 保存巡检签名，不用于人工处理。\n\n\`\`\`json\n${JSON.stringify(nextState)}\n\`\`\``;
  if (stateIssue) await githubRequest(`/repos/${repo}/issues/${stateIssue.number}`, token, { method: "PATCH", body: JSON.stringify({ title: "[website-anomaly] 状态基线", body: stateBody, state: "closed" }) });
  else {
    const created = await githubRequest(`/repos/${repo}/issues`, token, { method: "POST", body: JSON.stringify({ title: "[website-anomaly] 状态基线", body: stateBody, labels: [stateLabel] }) });
    await githubRequest(`/repos/${repo}/issues/${created.number}`, token, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
  }
  return events;
}

export async function reportRunFailure({ repo, token, message, runUrl }) {
  const label = "website-anomaly";
  await ensureLabel(repo, token, label, "b60205", "网站自主巡检发现");
  const fingerprint = "audit-run-failed-000000";
  const issues = await githubRequest(`/repos/${repo}/issues?state=open&per_page=100&labels=${encodeURIComponent(label)}`, token);
  const existing = issues.find((issue) => issue.body?.includes(marker(fingerprint)));
  const body = `${marker(fingerprint)}\n\n巡检运行未能生成完整报告。\n\n- 错误：${String(message).slice(0, 1000)}\n${runUrl ? `- [查看运行](${runUrl})` : ""}`;
  if (existing) await githubRequest(`/repos/${repo}/issues/${existing.number}`, token, { method: "PATCH", body: JSON.stringify({ title: "[P1] 网站自主巡检运行失败", body }) });
  else await githubRequest(`/repos/${repo}/issues`, token, { method: "POST", body: JSON.stringify({ title: "[P1] 网站自主巡检运行失败", body, labels: [label] }) });
}
