// Fails the build when any exported HTML file is over 1.5MB.
// Googlebot stops reading a document at 2MB. The drink index used to ship the
// shelf twice (visible HTML plus the RSC flight payload) and crossed that line.
// 1.5MB is decimal, matching `wc -c` (1_500_000 bytes), not 1.5MiB.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const HTML_LIMIT_BYTES = 1_500_000;

/**
 * @param {{ path: string, bytes: number }[]} files
 * @returns {string[]}
 */
export function htmlSizeIssues(files, limit = HTML_LIMIT_BYTES) {
  return files
    .filter((file) => file.bytes > limit)
    .map((file) => `${file.path} is ${file.bytes} bytes, over the ${limit} byte HTML limit`);
}

function walkHtml(dir) {
  /** @type {{ path: string, bytes: number }[]} */
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtml(full));
    } else if (entry.name.endsWith(".html")) {
      files.push({ path: full, bytes: statSync(full).size });
    }
  }
  return files;
}

/** The checker must reject one byte over the limit and accept a file sitting on it. */
export function selfTestHtmlSize() {
  const over = htmlSizeIssues([{ path: "big.html", bytes: HTML_LIMIT_BYTES + 1 }]);
  if (over.length !== 1 || !over[0].includes("big.html")) {
    throw new Error(`self-test: oversized HTML was not flagged: ${over.join("; ")}`);
  }
  const onLimit = htmlSizeIssues([{ path: "ok.html", bytes: HTML_LIMIT_BYTES }]);
  if (onLimit.length !== 0) {
    throw new Error(`self-test: a file of exactly ${HTML_LIMIT_BYTES} bytes was rejected`);
  }
  const empty = htmlSizeIssues([]);
  if (empty.length !== 0) {
    throw new Error("self-test: no files should not fail");
  }
}

function checkExport(root = "out") {
  selfTestHtmlSize();
  if (!existsSync(root)) {
    console.error(`missing ${root}`);
    process.exit(1);
  }
  const files = walkHtml(root);
  if (files.length === 0) {
    console.error(`${root} has no HTML files`);
    process.exit(1);
  }
  const issues = htmlSizeIssues(files);
  if (issues.length > 0) {
    for (const message of issues.slice(0, 20)) {
      console.error(message);
    }
    if (issues.length > 20) {
      console.error(`…and ${issues.length - 20} more HTML files over the limit`);
    }
    process.exit(1);
  }
  const largest = files.reduce((best, file) => (file.bytes > best.bytes ? file : best));
  console.log(`html size ok: ${files.length} files, largest ${largest.path} ${largest.bytes} bytes`);
}

checkExport();
