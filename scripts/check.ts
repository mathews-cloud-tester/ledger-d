import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const failures: string[] = [];

function listedExports(): Set<string> {
  const checks = readFileSync("CHECKS.md", "utf8");
  return new Set([...checks.matchAll(/^\| `([A-Za-z0-9_]+)` \|/gm)].map((m) => m[1]));
}

function ledgerExports(): Array<{ name: string; file: string }> {
  const dir = join("src", "ledger");
  const out: Array<{ name: string; file: string }> = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const text = readFileSync(join(dir, file), "utf8");
    for (const m of text.matchAll(/^export (?:async )?function ([A-Za-z0-9_]+)/gm)) {
      out.push({ name: m[1], file: join(dir, file) });
    }
  }
  return out;
}

function rule1() {
  const listed = listedExports();
  const actual = ledgerExports();
  for (const { name, file } of actual) {
    if (!listed.has(name)) failures.push(`rule 1: ${file} exports ${name}, which CHECKS.md does not list`);
  }
  const names = new Set(actual.map((e) => e.name));
  for (const name of listed) {
    if (!names.has(name)) failures.push(`rule 1: CHECKS.md lists ${name}, which nothing under src/ledger/ exports`);
  }
}

function changedFiles(base: string): string[] {
  const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

function rule2() {
  const base = process.env.CI_BASE_SHA;
  if (!base) {
    console.log("rule 2 skipped: CI_BASE_SHA is not set");
    return;
  }
  const changed = changedFiles(base);
  if (!changed.some((f) => f.startsWith("src/ledger/"))) return;
  if (!changed.includes("CHANGELOG.md")) {
    failures.push("rule 2: src/ledger/ changed but CHANGELOG.md did not");
    return;
  }
  const diff = execFileSync("git", ["diff", `${base}...HEAD`, "--", "CHANGELOG.md"], { encoding: "utf8" });
  const added = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++") && l.trim().length > 1);
  if (added.length === 0) failures.push("rule 2: CHANGELOG.md changed but no line was added");
}

rule1();
rule2();
if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log("all repository rules hold");
