// Last content change of a drink row, ignoring store-URL-only edits.
// Amazon / 楽天 / 直販 / その他 can change without moving sitemap lastmod.
// Name, copy, official URL, image, vessel, and publish flags still move it.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const STORE_URL_COLUMNS = new Set(["AmazonURL", "楽天URL", "直販URL", "その他URL"]);

const DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function parseCsv(text) {
  const rows = [];
  let row = [];
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

export function rowsBySlug(text) {
  const table = parseCsv(text);
  const map = new Map();
  if (table.length === 0) {
    return map;
  }
  const header = table[0];
  for (const cells of table.slice(1)) {
    const row = {};
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = cells[i] ?? "";
    }
    if (row.slug) {
      map.set(row.slug, row);
    }
  }
  return map;
}

export function contentSignature(row) {
  return Object.keys(row)
    .filter((key) => key && !STORE_URL_COLUMNS.has(key))
    .sort()
    .map((key) => `${key}=${row[key] ?? ""}`)
    .join("\n");
}

function signatureOf(rows, slug) {
  const row = rows.get(slug);
  return row ? contentSignature(row) : null;
}

export function dayFromUnix(seconds) {
  return DAY.format(new Date(seconds * 1000));
}

/**
 * history is newest-first: [{ time, text }].
 * headText is the committed HEAD file (not the working tree).
 * Returns slug → unix time, or null when the working tree changed content.
 */
export function drinkContentTimes({ currentText, headText, history }) {
  const current = rowsBySlug(currentText);
  const head = headText != null ? rowsBySlug(headText) : new Map();
  const parsedHistory = history.map((entry) => ({ time: entry.time, rows: rowsBySlug(entry.text) }));
  const times = new Map();

  for (const slug of current.keys()) {
    const currentSig = signatureOf(current, slug);
    const headSig = signatureOf(head, slug);
    if (currentSig !== headSig) {
      times.set(slug, null);
      continue;
    }
    let found = null;
    for (let i = 0; i < parsedHistory.length; i += 1) {
      const sig = signatureOf(parsedHistory[i].rows, slug);
      const older = parsedHistory[i + 1];
      const olderSig = older ? signatureOf(older.rows, slug) : null;
      if (sig != null && sig !== olderSig) {
        found = parsedHistory[i].time;
        break;
      }
    }
    times.set(slug, found);
  }
  return times;
}

function gitText(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

/** Load committed drinks.csv history from this repo. Null when git is unavailable. */
export function loadDrinkCsvHistory() {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" });
  } catch {
    return null;
  }
  let log;
  try {
    log = gitText(["log", "--format=%H %ct", "--", "data/drinks.csv"]).trim();
  } catch {
    return null;
  }
  if (!log) {
    return { headText: null, history: [] };
  }
  const history = [];
  for (const line of log.split("\n")) {
    const space = line.indexOf(" ");
    const hash = line.slice(0, space);
    const time = Number(line.slice(space + 1));
    let text;
    try {
      text = gitText(["show", `${hash}:data/drinks.csv`]);
    } catch {
      return null;
    }
    history.push({ hash, time, text });
  }
  let headText = null;
  try {
    headText = gitText(["show", "HEAD:data/drinks.csv"]);
  } catch {
    headText = null;
  }
  return { headText, history };
}

export function drinkContentLastmods(currentText = readFileSync("data/drinks.csv", "utf8"), loaded = loadDrinkCsvHistory()) {
  if (!loaded) {
    return null;
  }
  const times = drinkContentTimes({
    currentText,
    headText: loaded.headText,
    history: loaded.history,
  });
  const days = new Map();
  for (const [slug, time] of times) {
    days.set(slug, time == null ? null : dayFromUnix(time));
  }
  return days;
}
