import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { finding } from "./model.mjs";

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), options.timeoutMs || 180_000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error((stderr || stdout || `安全扫描退出码 ${code}`).slice(0, 2000)));
    });
  });
}

export async function auditSecurity(config) {
  if (!config.security.enabled) return {
    findings: [],
    stage: { id: "security", name: "源码安全", status: "skipped", required: false, detail: "站点配置已关闭安全扫描" },
    raw: null,
  };
  const cliPath = config.security.cliPath;
  try {
    await fs.access(cliPath);
    await fs.access(config.sourceRoot);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "website-anomaly-security-"));
    const output = path.join(tempDir, "security.json");
    try {
      const args = [cliPath, "--source", config.sourceRoot, "--project-name", config.name, "--target-url", config.baseUrl, "--output", output];
      if (config.security.excludedPaths.length) args.push("--exclude", config.security.excludedPaths.join(","));
      await runProcess(process.execPath, args);
      const raw = JSON.parse(await fs.readFile(output, "utf8"));
      const mapped = (raw.findings || []).map((item) => finding({
        ruleId: `security:${item.origin || item.category || "finding"}:${item.title}`,
        severity: item.severity,
        category: `安全：${item.category}`,
        title: item.title,
        location: item.evidence?.location || config.sourceRoot,
        evidence: item.evidence?.line ? `第 ${item.evidence.line} 行：${item.evidence.snippet || "已脱敏"}` : item.evidence?.snippet || "已脱敏证据",
        impact: item.impact,
        remediation: item.remediation,
        confidence: item.confidence,
        verification: item.verificationStatus || "CONFIRMED",
        source: "security",
      }));
      const incomplete = (raw.stages || []).filter((stage) => stage.requirement === "required" && stage.status !== "completed");
      return {
        findings: mapped,
        stage: { id: "security", name: "源码与依赖安全", status: incomplete.length ? "failed" : "completed", required: true, detail: `安全引擎 ${raw.metadata?.engineVersion || "unknown"}，${mapped.length} 项发现，源码指纹 ${raw.metadata?.sourceDigest || "unknown"}` },
        raw,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    return {
      findings: [finding({ ruleId: "security-stage", severity: "P1", category: "检查完整性", title: "源码安全扫描未完成", location: config.sourceRoot, evidence: error.message, remediation: "恢复共享安全 CLI 或依赖审计网络后重跑；本次不能判定通过。" })],
      stage: { id: "security", name: "源码与依赖安全", status: "failed", required: true, detail: error.message },
      raw: null,
    };
  }
}

export async function runSecurityCommand({ source, targetUrl, output, projectName = "Website" , cliPath }) {
  const resolvedCli = path.resolve(cliPath || process.env.WEBSITE_SECURITY_CLI || path.join(process.cwd(), "vendor/security-cli.mjs"));
  const args = [resolvedCli, "--source", path.resolve(source), "--project-name", projectName, "--output", path.resolve(output)];
  if (targetUrl) args.push("--target-url", targetUrl);
  await runProcess(process.execPath, args);
  return JSON.parse(await fs.readFile(path.resolve(output), "utf8"));
}
