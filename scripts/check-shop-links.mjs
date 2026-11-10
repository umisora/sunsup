// Shop anchors must carry rel=sponsored and must all open in a new tab.
// A shop anchor is a buy link: Amazon, Rakuten, a direct shop, or any other retailer,
// including product URLs that do not have an affiliate tag yet.
// In-site links must not be sponsored. A 公式 brand URL is not a shop link
// unless that same URL is also a buy link.
//
// Buy URLs are the goal kinds on each drink page's #out-links map
// (amazon, rakuten, direct, other), data-out-kind on a scene list,
// and known retailer hosts (kept in step with RETAILER_DOMAINS in lib/out-links.ts).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const GOAL_KINDS = new Set(["amazon", "rakuten", "direct", "other"]);
const SHOP_TARGET = "_blank";
const BLANK_REL = ["noopener", "noreferrer"];
const RETAILER_DOMAINS = [
  "amazon.co.jp",
  "rakuten.co.jp",
  "askul.co.jp",
  "shopping.yahoo.co.jp",
  "yodobashi.com",
  "monotaro.com",
  "tanomail.com",
  "yamada-denkiweb.com",
];
const ORIGIN = "https://stylish.sunsup.me";

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(tag, name) {
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`, "i").exec(tag);
  return match ? decode(match[1]) : undefined;
}

function relTokens(rel) {
  return new Set((rel ?? "").split(/\s+/).filter(Boolean));
}

function isRetailerHref(href) {
  try {
    const host = new URL(href, `${ORIGIN}/`).hostname.toLowerCase();
    return RETAILER_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isInternalHref(href) {
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return true;
  }
  try {
    return new URL(href, `${ORIGIN}/`).origin === ORIGIN;
  } catch {
    return false;
  }
}

/**
 * @param {{ path: string, html: string }[]} files
 * @returns {{ issues: string[], shopAnchors: number, sponsoredAnchors: number }}
 */
export function shopLinkReport(files) {
  /** @type {string[]} */
  const issues = [];
  const shopHrefs = new Set();
  for (const file of files) {
    const outLinks = new RegExp('<script\\b[^>]*\\bid="out-links"[^>]*>([\\s\\S]*?)<\\/script>', "gi");
    for (const match of file.html.matchAll(outLinks)) {
      try {
        const data = JSON.parse(match[1] ?? "");
        const links = data && typeof data === "object" ? data.links : undefined;
        if (!links || typeof links !== "object") {
          continue;
        }
        for (const [href, kind] of Object.entries(links)) {
          if (GOAL_KINDS.has(kind)) {
            shopHrefs.add(href);
          }
        }
      } catch {
        issues.push(`${file.path} has unreadable #out-links JSON`);
      }
    }
  }

  let shopAnchors = 0;
  let sponsoredAnchors = 0;
  /** @type {Map<string, number>} */
  const targets = new Map();

  for (const file of files) {
    const hidden = new RegExp("<script\\b[^>]*>[\\s\\S]*?<\\/script>|<style\\b[^>]*>[\\s\\S]*?<\\/style>", "gi");
    const anchor = new RegExp("<a\\b[^>]*>", "gi");
    const visible = file.html.replace(hidden, "");
    for (const match of visible.matchAll(anchor)) {
      const tag = match[0];
      const href = attr(tag, "href");
      if (!href) {
        continue;
      }
      const rel = relTokens(attr(tag, "rel"));
      const kind = attr(tag, "data-out-kind");
      if (isInternalHref(href)) {
        if (rel.has("sponsored")) {
          issues.push(`${file.path} internal link is rel=sponsored: ${href}`);
        }
        continue;
      }
      const shop = shopHrefs.has(href) || GOAL_KINDS.has(kind ?? "") || isRetailerHref(href);
      if (!shop) {
        if (rel.has("sponsored")) {
          issues.push(`${file.path} non-shop link is rel=sponsored: ${href}`);
        }
        continue;
      }
      shopAnchors += 1;
      if (rel.has("sponsored")) {
        sponsoredAnchors += 1;
      } else {
        issues.push(`${file.path} shop link is missing rel=sponsored: ${href}`);
      }
      const target = attr(tag, "target") ?? "";
      targets.set(target, (targets.get(target) ?? 0) + 1);
      if (target === SHOP_TARGET) {
        for (const token of BLANK_REL) {
          if (!rel.has(token)) {
            issues.push(`${file.path} shop link target="_blank" is missing rel=${token}: ${href}`);
            break;
          }
        }
      }
    }
  }

  if (targets.size > 1) {
    const summary = [...targets.entries()].map(([target, count]) => `${target || "(none)"}=${count}`).join(", ");
    issues.push(`shop links use inconsistent target: ${summary}`);
  } else if (targets.size === 1) {
    const [only] = [...targets.keys()];
    if (only !== SHOP_TARGET) {
      issues.push(`shop links use target="${only || "(none)"}", expected "${SHOP_TARGET}"`);
    }
  }

  return { issues, shopAnchors, sponsoredAnchors };
}

function assert(ok, message) {
  if (!ok) {
    throw new Error(`self-test: ${message}`);
  }
}

/** The checker must reject the old rel, mixed targets, and sponsored on in-site or brand links. */
export function selfTestShopLinks() {
  const amazon = "https://www.amazon.co.jp/dp/B079QW8R2R";
  const direct = "https://jp.example.com/products/yuzu?a=1&b=2";
  const official = "https://brand.example/yuzu";
  const line = "https://line.me/R/share?text=hello";
  const map = `<script type="application/json" id="out-links">${JSON.stringify({
    slug: "x",
    links: { [amazon]: "amazon", [direct]: "direct", [official]: "official" },
  })}</script>`;
  const goodRel = "sponsored noopener noreferrer nofollow";
  const good = shopLinkReport([
    {
      path: "good.html",
      html: `<body>${map}
        <a href="${amazon}" target="_blank" rel="${goodRel}">Amazonで見る</a>
        <a href="${direct.replaceAll("&", "&amp;")}" target="_blank" rel="noopener noreferrer sponsored">公式ショップで見る</a>
        <a href="${official}" target="_blank" rel="noopener nofollow">公式サイトで見る</a>
        <a href="${line}" target="_blank" rel="noreferrer">LINE</a>
        <a href="/drink/">ドリンク一覧</a>
        <a href="https://stylish.sunsup.me/about/">運営</a>
      </body>`,
    },
  ]);
  assert(good.issues.length === 0, good.issues.join("; ") || "good page failed");
  assert(good.shopAnchors === 2 && good.sponsoredAnchors === 2, `good counts ${good.shopAnchors}/${good.sponsoredAnchors}`);

  const missing = shopLinkReport([
    {
      path: "old.html",
      html: `<body>${map}<a href="${amazon}" target="_blank" rel="noopener nofollow">Amazonで見る</a></body>`,
    },
  ]);
  assert(missing.issues.some((issue) => issue.includes("missing rel=sponsored")), missing.issues.join("; ") || "old rel was accepted");
  assert(missing.issues.some((issue) => issue.includes("missing rel=noreferrer")), missing.issues.join("; ") || "missing noreferrer was accepted");
  assert(missing.sponsoredAnchors === 0 && missing.shopAnchors === 1, `old counts ${missing.shopAnchors}/${missing.sponsoredAnchors}`);

  const mixed = shopLinkReport([
    { path: "a.html", html: `<a href="${amazon}" target="_blank" rel="${goodRel}">Amazonで見る</a>` },
    { path: "b.html", html: `<a href="${amazon}" rel="${goodRel}">Amazonで見る</a>` },
  ]);
  assert(mixed.issues.some((issue) => issue.includes("inconsistent target")), mixed.issues.join("; ") || "mixed targets were accepted");

  const internal = shopLinkReport([
    {
      path: "in.html",
      html: `<a href="/drink/kimino-yuzu/" rel="sponsored">ドリンク</a><a href="https://stylish.sunsup.me/ba/office/" rel="noopener sponsored">オフィス</a>`,
    },
  ]);
  assert(internal.shopAnchors === 0 && internal.issues.length === 2, internal.issues.join("; ") || "internal sponsored was accepted");

  const brand = shopLinkReport([
    {
      path: "brand.html",
      html: `${map}<a href="${official}" target="_blank" rel="${goodRel}">公式サイトで見る</a>`,
    },
  ]);
  assert(brand.shopAnchors === 0 && brand.issues.some((issue) => issue.includes("non-shop")), brand.issues.join("; ") || "brand site sponsored was accepted");

  const tagged = shopLinkReport([
    {
      path: "list.html",
      html: `<a href="https://shop.example/item" target="_blank" rel="${goodRel}" data-out-kind="direct">公式ショップ</a>`,
    },
  ]);
  assert(tagged.issues.length === 0 && tagged.shopAnchors === 1, tagged.issues.join("; ") || "data-out-kind shop link was rejected");

  const retailer = shopLinkReport([
    {
      path: "yahoo.html",
      html: `<a href="https://store.shopping.yahoo.co.jp/x/y" target="_blank" rel="nofollow">ヤフー</a>`,
    },
  ]);
  assert(retailer.issues.some((issue) => issue.includes("missing rel=sponsored")), retailer.issues.join("; ") || "yahoo shop link was accepted");

  const none = shopLinkReport([{ path: "none.html", html: `<a href="/">トップ</a>` }]);
  assert(none.issues.length === 0 && none.shopAnchors === 0, none.issues.join("; ") || "an in-site page was flagged");
}

function walkHtml(dir) {
  /** @type {{ path: string, html: string }[]} */
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtml(full));
    } else if (entry.name.endsWith(".html")) {
      files.push({ path: full, html: readFileSync(full, "utf8") });
    }
  }
  return files;
}

function checkExport(root = "out") {
  selfTestShopLinks();
  if (!existsSync(root)) {
    console.error(`missing ${root}`);
    process.exit(1);
  }
  const files = walkHtml(root);
  if (files.length === 0) {
    console.error(`${root} has no HTML files`);
    process.exit(1);
  }
  const report = shopLinkReport(files);
  if (report.shopAnchors === 0) {
    report.issues.push(`${root} has no shop links`);
  }
  if (report.issues.length > 0) {
    console.error(`shop links: ${report.shopAnchors} anchors, ${report.sponsoredAnchors} with rel=sponsored`);
    for (const message of report.issues.slice(0, 20)) {
      console.error(`✗ ${message}`);
    }
    if (report.issues.length > 20) {
      console.error(`…and ${report.issues.length - 20} more`);
    }
    process.exit(1);
  }
  console.log(`shop links ok: ${report.shopAnchors} anchors, ${report.sponsoredAnchors} with rel=sponsored, target="${SHOP_TARGET}"`);
}

checkExport();
