#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import {
  compareRunFiles,
  reportRunFailure,
  runAudit,
  runSecurityCommand,
  syncGithubIssues,
} from "../src/index.mjs";

function parseArgs(values) {
  const result = { _: [] };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) { result._.push(value); continue; }
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else { result[key] = next; index += 1; }
  }
  return result;
}

function requireArg(args, key) {
  if (!args[key] || typeof args[key] !== "string") throw new Error(`缺少 --${key}`);
  return args[key];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (command === "run") {
    const { run, outputDir } = await runAudit({
      configPath: requireArg(args, "config"),
      outputPath: args.output,
      expectedRevision: args["expected-revision"] || process.env.EXPECTED_REVISION,
    });
    process.stdout.write(`${JSON.stringify({ runId: run.runId, decision: run.decision, counts: run.counts, outputDir })}\n`);
    process.exitCode = run.decision === "INCOMPLETE" ? 2
      : ["BLOCKED_P0", "ACTION_REQUIRED_P1"].includes(run.decision) ? 3 : 0;
    return;
  }
  if (command === "security") {
    const output = path.resolve(args.output || "security-report.json");
    const report = await runSecurityCommand({ source: requireArg(args, "source"), targetUrl: args["target-url"], output, projectName: args["project-name"], cliPath: args["security-cli"] });
    process.stdout.write(`${JSON.stringify({ output, decision: report.decision, counts: report.counts })}\n`);
    return;
  }
  if (command === "compare") {
    const result = await compareRunFiles(requireArg(args, "current"), requireArg(args, "baseline"), args.output);
    process.stdout.write(`${JSON.stringify({ changed: result.changed, new: result.new.length, worsened: result.worsened.length, resolved: result.resolved.length })}\n`);
    return;
  }
  if (command === "issues") {
    const action = args._[1];
    const repo = requireArg(args, "repo");
    const token = process.env.GITHUB_TOKEN;
    if (action === "sync") {
      const events = await syncGithubIssues({ runPath: requireArg(args, "run"), repo, token, runUrl: args["run-url"] });
      process.stdout.write(`${JSON.stringify(events)}\n`);
      return;
    }
    if (action === "failure") {
      let message = args.message || "巡检未生成完整报告";
      if (args["message-file"]) message = await fs.readFile(args["message-file"], "utf8");
      await reportRunFailure({ repo, token, message, runUrl: args["run-url"] });
      process.stdout.write("{\"reported\":true}\n");
      return;
    }
  }
  throw new Error("用法：audit run|security|compare；内部命令：audit issues sync|failure");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
