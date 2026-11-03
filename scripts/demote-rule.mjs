// Reads data/demote-rule.json, the same rule lib/demote.ts applies, and returns the demoted drinks.
// The checks use it to prove that no demoted drink opens a shelf, stands in a hero, or leads the office list.
import { readFileSync } from "node:fs";
import { join } from "node:path";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Map of slug to the rule ids that demote it, for every row of data/drinks.csv. */
export function demotedDrinks(root = process.cwd()) {
  const rule = JSON.parse(readFileSync(join(root, "data", "demote-rule.json"), "utf8"));
  const rules = rule.rules.map((item) => ({ id: item.id, name: new RegExp(item.name, "i") }));
  const look = new Set(Object.keys(rule.look));
  const allow = new Set(Object.keys(rule.allow));
  const table = parseCsv(readFileSync(join(root, "data", "drinks.csv"), "utf8"));
  const header = table[0];
  const rows = table.slice(1).map((cells) => Object.fromEntries(header.map((column, index) => [column, (cells[index] ?? "").trim()])));
  const known = new Set(rows.map((row) => row.slug));
  for (const [list, slugs] of [["look", look], ["allow", allow]]) {
    for (const slug of slugs) {
      if (!known.has(slug)) {
        throw new Error(`data/demote-rule.json ${list} names ${slug}, which is not in data/drinks.csv`);
      }
      if (!String(rule[list][slug] ?? "").trim()) {
        throw new Error(`data/demote-rule.json ${list}.${slug} must say why`);
      }
    }
  }
  for (const slug of allow) {
    if (look.has(slug)) {
      throw new Error(`data/demote-rule.json lists ${slug} in both look and allow`);
    }
    const row = rows.find((item) => item.slug === slug);
    if (!rules.some((item) => item.name.test(row["品名"]))) {
      throw new Error(`data/demote-rule.json allow.${slug} is stale: no name rule catches it`);
    }
  }
  const out = new Map();
  for (const row of rows) {
    const reasons = allow.has(row.slug) ? [] : rules.filter((item) => item.name.test(row["品名"])).map((item) => item.id);
    if (look.has(row.slug)) {
      reasons.push("look");
    }
    if (reasons.length > 0) {
      out.set(row.slug, reasons);
    }
  }
  return out;
}
