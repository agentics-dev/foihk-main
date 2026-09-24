import fs from "node:fs/promises";
import path from "node:path";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function decisionLabel(decision) {
  return ({ OBSERVATION: "观察模式", PASS: "通过", INCOMPLETE: "检查未完成", BLOCKED_P0: "P0 阻断", ACTION_REQUIRED_P1: "需要处理 P1" })[decision] || decision;
}

export function markdownReport(run) {
  const lines = [
    `# ${run.siteName} 网站异常巡检报告`,
    "",
    `- 结论：**${decisionLabel(run.decision)}**`,
    `- 时间：${run.completedAt}`,
    `- 线上地址：${run.baseUrl}`,
    `- 源码 commit：${run.sourceCommit || "无法读取"}`,
    `- 内容 revision：${run.contentRevision ?? "无法读取"}`,
    ...(run.triggeredRevision ? [`- 触发 revision：${run.triggeredRevision}`] : []),
    `- 发现：P0 ${run.counts.P0} / P1 ${run.counts.P1} / P2 ${run.counts.P2} / P3 ${run.counts.P3}`,
    `- 待核实候选：P0 ${run.candidateCounts?.P0 || 0} / P1 ${run.candidateCounts?.P1 || 0} / P2 ${run.candidateCounts?.P2 || 0} / P3 ${run.candidateCounts?.P3 || 0}`,
    "",
    "## 检查阶段",
    "",
    ...run.stages.map((stage) => `- ${stage.status === "completed" ? "✅" : stage.status === "failed" ? "❌" : "➖"} ${stage.name}：${stage.detail}`),
    "",
    "## 发现",
    "",
  ];
  if (!run.findings.length) lines.push("未发现自动化规则能够确认的异常。", "");
  for (const item of run.findings) {
    lines.push(
      `### [${item.severity}] ${item.title}`,
      "",
      `- 分类：${item.category}`,
      `- 状态：${item.verification === "CONFIRMED" ? "已确认" : "待核实"}；置信度 ${item.confidence}`,
      `- 位置：${item.location}`,
      `- 证据：${item.evidence || "无"}`,
      `- 影响：${item.impact}`,
      `- 建议：${item.remediation}`,
      `- 指纹：${item.fingerprint}`,
      "",
    );
  }
  lines.push(
    "## 已测试范围",
    "",
    ...run.testedScope.map((item) => `- ${item}`),
    "",
    "## 未测试范围",
    "",
    ...run.untestedScope.map((item) => `- ${item}`),
    "",
  );
  return lines.join("\n");
}

export function htmlReport(run) {
  const rows = run.findings.map((item) => `<article class="finding ${item.severity}"><h3>${escapeHtml(item.severity)} · ${escapeHtml(item.title)}</h3><dl><dt>状态</dt><dd>${item.verification === "CONFIRMED" ? "已确认" : "待核实"}</dd><dt>分类</dt><dd>${escapeHtml(item.category)}</dd><dt>位置</dt><dd>${escapeHtml(item.location)}</dd><dt>证据</dt><dd>${escapeHtml(item.evidence)}</dd><dt>影响</dt><dd>${escapeHtml(item.impact)}</dd><dt>建议</dt><dd>${escapeHtml(item.remediation)}</dd></dl></article>`).join("") || "<p>未发现自动化规则能够确认的异常。</p>";
  const stages = run.stages.map((stage) => `<li><strong>${escapeHtml(stage.status)}</strong> ${escapeHtml(stage.name)}：${escapeHtml(stage.detail)}</li>`).join("");
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(run.siteName)} 网站异常巡检报告</title><style>body{font:15px/1.65 system-ui,sans-serif;color:#17202a;max-width:1080px;margin:auto;padding:32px;background:#f6f8fa}header,.finding,section{background:white;border:1px solid #d8dee4;border-radius:10px;padding:20px;margin:16px 0}h1,h2,h3{line-height:1.25}.counts{display:flex;gap:12px;flex-wrap:wrap}.counts span{padding:6px 10px;border-radius:999px;background:#eef2f6}.finding{border-left:5px solid #64748b}.finding.P0{border-left-color:#b91c1c}.finding.P1{border-left-color:#dc2626}.finding.P2{border-left-color:#d97706}.finding.P3{border-left-color:#2563eb}dt{font-weight:700;margin-top:8px}dd{margin-left:0;overflow-wrap:anywhere}code{font-size:12px}</style></head><body><header><p>WEBSITE ANOMALY REPORT</p><h1>${escapeHtml(run.siteName)}</h1><p>结论：<strong>${escapeHtml(decisionLabel(run.decision))}</strong> · ${escapeHtml(run.completedAt)}</p><div class="counts"><span>已确认 P0 ${run.counts.P0}</span><span>P1 ${run.counts.P1}</span><span>P2 ${run.counts.P2}</span><span>P3 ${run.counts.P3}</span><span>待核实 ${Object.values(run.candidateCounts || {}).reduce((sum, value) => sum + value, 0)}</span></div></header><section><h2>检查阶段</h2><ul>${stages}</ul></section><main><h2>发现</h2>${rows}</main><section><h2>边界</h2><p>未登录、未提交表单、未上传文件、未发送攻击载荷，也未修改生产环境。</p></section></body></html>`;
}

export async function writeReports(run, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outputDir, "run.json"), `${JSON.stringify(run, null, 2)}\n`),
    fs.writeFile(path.join(outputDir, "report.md"), markdownReport(run)),
    fs.writeFile(path.join(outputDir, "report.html"), htmlReport(run)),
  ]);
}
