/**
 * Judge catalog stills in public/drinks against scripts/still-rubric.md.
 *
 * Vision is a JSON file or a directory of JSON files. Each record is one
 * image, looked at, with the six checks. This script does not invent those
 * checks from pixel heuristics. It does hash the files, flags a byte-identical
 * image reused across slugs, validates every record, and writes the audit.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts.mjs \
 *     scripts/judge-stills.mts --vision data/still-vision
 *
 *   node --experimental-strip-types --import ./scripts/register-ts.mjs \
 *     scripts/judge-stills.mts --check data/still-audit.json
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const CHECKS = [
  "correct_product",
  "single_product",
  "whole_product",
  "clean_background",
  "quality",
  "orientation_upright",
] as const;

type CheckName = (typeof CHECKS)[number];

const Check = z.object({
  ok: z.boolean(),
  reason: z.string().trim().min(1).max(280),
});

const VisionVerdict = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  correct_product: Check,
  single_product: Check,
  whole_product: Check,
  clean_background: Check,
  quality: Check,
  orientation_upright: Check,
});

const AuditVerdict = VisionVerdict.extend({
  file: z.string().regex(/^\/drinks\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  reused: Check,
  pass: z.boolean(),
});

const AuditFile = z.object({
  version: z.literal(1),
  rubric: z.literal("scripts/still-rubric.md"),
  total: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  verdicts: z.array(AuditVerdict),
});

type Vision = z.infer<typeof VisionVerdict>;
type AuditVerdictRow = z.infer<typeof AuditVerdict>;

type CatalogStill = {
  slug: string;
  file: string;
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") {
        i += 1;
      }
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function catalogStills(): CatalogStill[] {
  const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
  const header = table[0];
  if (!header) {
    fail("drinks.csv is empty");
  }
  const slugAt = header.indexOf("slug");
  const stillAt = header.indexOf("静物URL");
  if (slugAt < 0 || stillAt < 0) {
    fail("drinks.csv is missing slug or 静物URL");
  }
  const stills: CatalogStill[] = [];
  for (const row of table.slice(1)) {
    const slug = (row[slugAt] ?? "").trim();
    const still = (row[stillAt] ?? "").trim();
    if (!still.startsWith("/drinks/") || still.includes("fallback-")) {
      continue;
    }
    stills.push({ slug, file: still });
  }
  stills.sort((a, b) => a.slug.localeCompare(b.slug));
  return stills;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function visionRecords(path: string): unknown[] {
  if (!existsSync(path)) {
    fail(`missing vision input ${path}`);
  }
  if (statSync(path).isDirectory()) {
    const files = readdirSync(path)
      .filter((name) => name.endsWith(".json"))
      .sort();
    if (files.length === 0) {
      fail(`no JSON files in ${path}`);
    }
    return files.flatMap((name) => asArray(readJson(join(path, name)), join(path, name)));
  }
  return asArray(readJson(path), path);
}

function asArray(value: unknown, path: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object" && "verdicts" in value && Array.isArray(value.verdicts)) {
    return value.verdicts;
  }
  fail(`${path} must be a JSON array of vision verdicts`);
}

function webpSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    fail(`not a webp file: ${path}`);
  }
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (kind === "VP8X" && size >= 10) {
      return {
        width: 1 + bytes.readUIntLE(data + 4, 3),
        height: 1 + bytes.readUIntLE(data + 7, 3),
      };
    }
    if (kind === "VP8 " && size >= 10) {
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (kind === "VP8L" && size >= 5) {
      const bits = bytes.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    offset = data + size + (size % 2);
  }
  fail(`could not read webp size: ${path}`);
}

function loadVision(path: string): Map<string, Vision> {
  const parsed = z.array(VisionVerdict).safeParse(visionRecords(path));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    fail(`vision JSON: ${issue?.path.join(".") ?? ""} ${issue?.message ?? "invalid"}`);
  }
  const bySlug = new Map<string, Vision>();
  for (const row of parsed.data) {
    if (bySlug.has(row.slug)) {
      fail(`duplicate vision verdict for ${row.slug}`);
    }
    bySlug.set(row.slug, row);
  }
  return bySlug;
}

function judge(visionPath: string): AuditVerdictRow[] {
  const stills = catalogStills();
  const vision = loadVision(visionPath);
  const missing = stills.filter((still) => !vision.has(still.slug)).map((still) => still.slug);
  if (missing.length > 0) {
    fail(`vision is missing ${missing.length} stills: ${missing.slice(0, 12).join(", ")}`);
  }
  const known = new Set(stills.map((still) => still.slug));
  const extra = [...vision.keys()].filter((slug) => !known.has(slug));
  if (extra.length > 0) {
    fail(`vision has ${extra.length} slugs without a 静物URL: ${extra.slice(0, 12).join(", ")}`);
  }

  const hashed = stills.map((still) => {
    const absolute = join("public", still.file.slice(1));
    if (!existsSync(absolute)) {
      fail(`missing file for ${still.slug}: ${absolute}`);
    }
    const bytes = readFileSync(absolute);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const size = webpSize(absolute);
    return { ...still, absolute, sha256, ...size };
  });

  const byHash = new Map<string, string[]>();
  for (const row of hashed) {
    const list = byHash.get(row.sha256) ?? [];
    list.push(row.slug);
    byHash.set(row.sha256, list);
  }

  return hashed.map((row) => {
    const seen = vision.get(row.slug);
    if (!seen) {
      fail(`missing vision for ${row.slug}`);
    }
    const twins = (byHash.get(row.sha256) ?? []).filter((slug) => slug !== row.slug);
    const reused =
      twins.length > 0
        ? { ok: false, reason: `Same bytes as ${twins.join(", ")}.` }
        : { ok: true, reason: "No other slug shares this file." };
    const checks: Record<CheckName, z.infer<typeof Check>> = {
      correct_product: seen.correct_product,
      single_product: seen.single_product,
      whole_product: seen.whole_product,
      clean_background: seen.clean_background,
      quality: seen.quality,
      orientation_upright: seen.orientation_upright,
    };
    const pass = reused.ok && CHECKS.every((name) => checks[name].ok);
    return {
      slug: row.slug,
      file: row.file,
      sha256: row.sha256,
      width: row.width,
      height: row.height,
      ...checks,
      reused,
      pass,
    };
  });
}

function summarize(rows: AuditVerdictRow[]): void {
  const failed = rows.filter((row) => !row.pass);
  const tally = new Map<string, number>();
  for (const row of failed) {
    for (const name of CHECKS) {
      if (!row[name].ok) {
        tally.set(name, (tally.get(name) ?? 0) + 1);
      }
    }
    if (!row.reused.ok) {
      tally.set("reused", (tally.get("reused") ?? 0) + 1);
    }
  }
  console.log(`judged ${rows.length}  passed ${rows.length - failed.length}  failed ${failed.length}`);
  for (const [name, count] of tally) {
    console.log(`  ${name}: ${count}`);
  }
  console.log("");
  console.log("| slug | failed checks |");
  console.log("| --- | --- |");
  for (const row of failed) {
    const names = [
      ...CHECKS.filter((name) => !row[name].ok),
      ...(row.reused.ok ? [] : ["reused" as const]),
    ];
    console.log(`| ${row.slug} | ${names.join(", ")} |`);
  }
}

function writeAudit(rows: AuditVerdictRow[], outPath: string): void {
  const passed = rows.filter((row) => row.pass).length;
  const audit = {
    version: 1 as const,
    rubric: "scripts/still-rubric.md" as const,
    total: rows.length,
    passed,
    failed: rows.length - passed,
    verdicts: rows,
  };
  const checked = AuditFile.parse(audit);
  writeFileSync(outPath, `${JSON.stringify(checked, null, 2)}\n`);
  console.log(`wrote ${outPath}`);
}

function checkAudit(path: string): void {
  const parsed = AuditFile.safeParse(readJson(path));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    fail(`audit schema: ${issue?.path.join(".") ?? ""} ${issue?.message ?? "invalid"}`);
  }
  const audit = parsed.data;
  if (audit.verdicts.length !== audit.total) {
    fail(`audit total ${audit.total} does not match ${audit.verdicts.length} verdicts`);
  }
  const passed = audit.verdicts.filter((row) => row.pass).length;
  if (passed !== audit.passed || audit.failed !== audit.total - audit.passed) {
    fail("audit counts do not match verdicts");
  }
  const stills = catalogStills();
  if (stills.length !== audit.verdicts.length) {
    fail(`catalog has ${stills.length} stills, audit has ${audit.verdicts.length}`);
  }
  const bySlug = new Map(audit.verdicts.map((row) => [row.slug, row]));
  for (const still of stills) {
    const row = bySlug.get(still.slug);
    if (!row) {
      fail(`audit missing ${still.slug}`);
    }
    if (row.file !== still.file) {
      fail(`${still.slug} file is ${still.file} in the catalog and ${row.file} in the audit`);
    }
    const absolute = join("public", still.file.slice(1));
    const sha256 = createHash("sha256").update(readFileSync(absolute)).digest("hex");
    if (sha256 !== row.sha256) {
      fail(`${still.slug} bytes changed since the audit`);
    }
    const size = webpSize(absolute);
    if (size.width !== row.width || size.height !== row.height) {
      fail(`${still.slug} dimensions changed since the audit`);
    }
    const visualOk = CHECKS.every((name) => row[name].ok);
    const expect = visualOk && row.reused.ok;
    if (row.pass !== expect) {
      fail(`${still.slug} pass flag disagrees with its checks`);
    }
  }
  console.log(`audit ok: ${audit.total} judged, ${audit.passed} passed, ${audit.failed} failed`);
}

function argument(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }
  return process.argv[index + 1];
}

const checkPath = argument("--check");
if (checkPath) {
  checkAudit(checkPath);
} else {
  const visionPath = argument("--vision");
  if (!visionPath) {
    fail("pass --vision <file-or-directory> or --check <audit.json>");
  }
  const outPath = argument("--out") ?? join("data", "still-audit.json");
  const rows = judge(visionPath);
  writeAudit(rows, outPath);
  summarize(rows);
  if (rows.some((row) => !row.pass)) {
    process.exitCode = 1;
  }
}
