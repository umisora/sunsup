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
  const rules = rule.rules.map((item) => ({
    id: item.id,
    name: item.name ? new RegExp(item.name, "i") : undefined,
    look: item.look ? new RegExp(item.look, "i") : undefined,
    vessels: item.vessels,
  }));
  const judged = new Set(rule.slugs);
  const table = parseCsv(readFileSync(join(root, "data", "drinks.csv"), "utf8"));
  const header = table[0];
  const out = new Map();
  for (const cells of table.slice(1)) {
    const row = Object.fromEntries(header.map((column, index) => [column, (cells[index] ?? "").trim()]));
    const reasons = rules
      .filter((item) => !item.vessels || item.vessels.includes(row["容器"]))
      .filter((item) => item.name?.test(row["品名"]) || item.look?.test(row["見た目"]))
      .map((item) => item.id);
    if (judged.has(row.slug)) {
      reasons.push("judged");
    }
    if (reasons.length > 0) {
      out.set(row.slug, reasons);
    }
  }
  return out;
}
