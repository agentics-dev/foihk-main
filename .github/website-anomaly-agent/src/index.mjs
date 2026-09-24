import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadConfig, resolveOutputPath } from "./config.mjs";
import { auditWebsite } from "./web-audit.mjs";
import { auditSecurity } from "./security.mjs";
import { candidateCountsFor, countsFor, decisionFor, finding, parseExpectedRevision, sortFindings } from "./model.mjs";
import { writeReports } from "./report.mjs";

const execFileAsync = promisify(execFile);

async function sourceCommit(sourceRoot) {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, timeout: 5000 });
    return stdout.trim();
  } catch { return null; }
}

function deduplicate(findings) {
  const map = new Map();
  for (const item of findings) {
    const existing = map.get(item.fingerprint);
    if (!existing || item.evidenceHash !== existing.evidenceHash) map.set(item.fingerprint, item);
  }
  return [...map.values()];
}

export async function runAudit({ configPath, outputPath, expectedRevision }) {
  const config = await loadConfig(configPath);
  const triggeredRevision = parseExpectedRevision(expectedRevision);
  const outputDir = resolveOutputPath(outputPath, `runs/${config.siteId}-${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  const startedAt = new Date().toISOString();
  const [web, security, commit] = await Promise.all([
    auditWebsite(config, outputDir),
    auditSecurity(config),
    sourceCommit(config.sourceRoot),
  ]);
  const completedAt = new Date().toISOString();
  const revisionFindings = triggeredRevision !== null && web.manifest?.revision !== triggeredRevision
    ? [finding({
      ruleId: "trigger-revision-mismatch",
      severity: "P1",
      category: "文章发布",
      title: "发布触发版本与线上内容版本不一致",
      location: new URL(config.manifestPath, config.baseUrl).toString(),
      evidence: `触发 revision=${triggeredRevision}，线上 revision=${web.manifest?.revision ?? "无法读取"}`,
      remediation: "等待目标部署完成，确认内容清单已经切换到该 revision 后重新巡检。",
    })]
    : [];
  const findings = sortFindings(deduplicate([...web.findings, ...security.findings, ...revisionFindings]).map((item) => ({
    ...item,
    firstSeenAt: completedAt,
    lastSeenAt: completedAt,
  })));
  const stages = [...web.stages, security.stage];
  const observation = Boolean(config.observationUntil && Date.now() < Date.parse(config.observationUntil));
  const run = {
    schemaVersion: 1,
    agentVersion: "1.0.0",
    runId: randomUUID(),
    siteId: config.siteId,
    siteName: config.name,
    baseUrl: config.baseUrl,
    startedAt,
    completedAt,
    sourceRoot: config.sourceRoot,
    sourceCommit: commit,
    sourceDigest: security.raw?.metadata?.sourceDigest || null,
    contentRevision: web.manifest?.revision ?? null,
    triggeredRevision,
    observationUntil: config.observationUntil || null,
    decision: decisionFor(findings, stages, observation),
    counts: countsFor(findings),
    candidateCounts: candidateCountsFor(findings),
    stages,
    findings,
    surfaces: web.surfaces,
    testedScope: [
      `${web.testedUrls.length} 个公开页面与文章 URL`,
      `${config.browserRoutes.length} 条关键路由的桌面及手机浏览器呈现`,
      `${config.redirectChecks.length} 个历史转址`,
      "当前源码的密钥模式、代码规则、依赖审计与只读 URL 安全烟测",
    ],
    untestedScope: [
      "未登录管理后台，未测试认证后的 CRUD、审批或角色权限",
      "未提交表单、上传文件、创建付款或发送攻击载荷",
      "自动规则不能保证发现所有业务逻辑、视觉审美或第三方平台内部故障",
    ],
    github: config.github || null,
  };
  await writeReports(run, outputDir);
  return { run, outputDir };
}

export { compareRuns, compareRunFiles } from "./compare.mjs";
export { runSecurityCommand } from "./security.mjs";
export { syncGithubIssues, reportRunFailure } from "./github-issues.mjs";
