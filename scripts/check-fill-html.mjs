// FillText must ship one readable copy of each animated paragraph.
// Per-character spans are created in the browser (runMotion.ts) and must not be in the static HTML.
// Crawlers that skip <script> (and don't run JS) are the ones this guards.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SCRIPT_OR_STYLE = /<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi;
const FILL = /<(h2|p)\b[^>]*\bdata-fill="true"[^>]*>([\s\S]*?)<\/\1>/gi;

export function outsideScripts(html) {
  return html.replace(SCRIPT_OR_STYLE, "");
}

function normalizedText(fragment) {
  return fragment.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
}

function countOccurrences(haystack, needle) {
  if (needle.length === 0) {
    return 0;
  }
  let count = 0;
  let from = 0;
  while (from <= haystack.length) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) {
      break;
    }
    count += 1;
    from = index + needle.length;
  }
  return count;
}

/** Problems in one HTML document. Empty means the fill paragraphs each occur once outside scripts. */
export function fillHtmlIssues(html, label = "page") {
  const issues = [];
  const visible = outsideScripts(html);
  const charCopies = visible.match(/data-fill-char/g)?.length ?? 0;
  if (charCopies > 0) {
    issues.push(`${label} has ${charCopies} data-fill-char in static HTML`);
  }
  const pageText = normalizedText(visible);
  const seen = new Set();
  for (const match of visible.matchAll(FILL)) {
    const raw = normalizedText(match[2]);
    // The old markup put the sentence in an sr-only span and again in the characters,
    // so the element's text is exactly the sentence twice. Count the sentence, not that blob.
    const text = repeatedSentence(raw) ?? raw;
    if (text.length === 0 || seen.has(text)) {
      continue;
    }
    seen.add(text);
    if (raw !== text) {
      issues.push(`${label} fill element repeats its text: ${text.slice(0, 24)}…`);
    }
    const count = countOccurrences(pageText, text);
    if (count !== 1) {
      issues.push(`${label} fill text occurs ${count} times outside scripts: ${text.slice(0, 24)}…`);
    }
  }
  return issues;
}

function repeatedSentence(text) {
  if (text.length % 2 !== 0) {
    return null;
  }
  const half = text.length / 2;
  const sentence = text.slice(0, half);
  return sentence.length > 0 && sentence === text.slice(half) ? sentence : null;
}

function walkHtml(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkHtml(full);
    }
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const REQUIRED = ["index.html", "ba/office/index.html", "category/citrus/index.html"];

export function fillExportIssues(root = "out") {
  const issues = [];
  if (!existsSync(root)) {
    return [`missing ${root}`];
  }
  for (const rel of REQUIRED) {
    const file = join(root, rel);
    if (!existsSync(file)) {
      issues.push(`missing ${file}`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    if (!outsideScripts(html).includes('data-fill="true"')) {
      issues.push(`${rel} has no data-fill paragraph`);
    }
  }
  for (const file of walkHtml(root)) {
    const html = readFileSync(file, "utf8");
    const visible = outsideScripts(html);
    if (!visible.includes("data-fill-char") && !visible.includes('data-fill="true"')) {
      continue;
    }
    issues.push(...fillHtmlIssues(html, file));
  }
  return issues;
}

/** The checker must reject the old doubled markup and accept a single text node. */
export function selfTestFillHtml() {
  const line = "定時後に出すなら、ここから選べます。";
  const chars = Array.from(line)
    .map((char) => `<span data-fill-char="true">${char}</span>`)
    .join("");
  const duplicated = `<h2 data-fill="true"><span class="sr">${line}</span><span aria-hidden="true"><span>${chars}</span></span></h2>`;
  const duplicatedIssues = fillHtmlIssues(duplicated, "duplicated");
  if (!duplicatedIssues.some((issue) => issue.includes("occurs 2 times")) || !duplicatedIssues.some((issue) => issue.includes("data-fill-char"))) {
    throw new Error(`self-test: duplicated fill HTML was not fully flagged: ${duplicatedIssues.join("; ")}`);
  }
  const clean = `<h2 data-fill="true"><span data-fill-line="true">${line}</span></h2><script>data-fill-char ${line}</script>`;
  const cleanIssues = fillHtmlIssues(clean, "clean");
  if (cleanIssues.length > 0) {
    throw new Error(`self-test: single-copy fill HTML was rejected: ${cleanIssues.join("; ")}`);
  }
  const repeated = `<p data-fill="true"><span data-fill-line="true">${line}</span></p><p>${line}</p>`;
  const repeatedIssues = fillHtmlIssues(repeated, "repeated");
  if (!repeatedIssues.some((issue) => issue.includes("occurs 2 times"))) {
    throw new Error(`self-test: a second copy of the paragraph was missed: ${repeatedIssues.join("; ")}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  selfTestFillHtml();
  console.log("fill html self-test ok");
}
