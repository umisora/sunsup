// Rakuten affiliate wrapping. Amazon and other stores stay as written.
// An already-wrapped hb.afl.rakuten.co.jp URL is returned unchanged.
import { DISCLOSURE_ABOUT, DISCLOSURE_FOOTER } from "../lib/disclosure.ts";
import { storeRows, type Drink } from "../lib/drinks.ts";
import { outLinkMap } from "../lib/out-links.ts";
import {
  RAKUTEN_AFFILIATE_ID,
  RAKUTEN_MEASUREMENT_ID,
  rakutenAffiliateUrl,
  rakutenDestinationUrl,
} from "../lib/rakuten-affiliate.ts";

const failures: string[] = [];

function expect(ok: boolean, message: string): void {
  if (!ok) {
    failures.push(message);
  }
}

const ITEM = "https://item.rakuten.co.jp/drink-market/b585-1/";
const PRODUCT = "https://product.rakuten.co.jp/shop/item/";
const SEARCH = "https://search.rakuten.co.jp/search/mall/yuzu/?s=2&sid=1";
const AMAZON = "https://www.amazon.co.jp/dp/B079QW8R2R";
const DIRECT = "https://jp.kimino.com/products/yuzu-drink-product-title";
const OTHER_RAKUTEN = "https://item.rakuten.co.jp/misonoya/b16-4/";

function wrapped(original: string): string {
  return `https://hb.afl.rakuten.co.jp/ichiba/${RAKUTEN_AFFILIATE_ID}/${RAKUTEN_MEASUREMENT_ID}?pc=${encodeURIComponent(original)}&link_type=hybrid_url`;
}

expect(DISCLOSURE_FOOTER === "楽天のリンクは広告です。", "footer disclosure copy");
expect(
  DISCLOSURE_ABOUT === "楽天のリンクは広告です。リンクから商品が売れると、STYLISH!に紹介料が入ることがあります。",
  "about disclosure copy",
);
expect(RAKUTEN_AFFILIATE_ID === "09c4c923.474b7a2d.09c4c924.410ae089", "affiliate id is the owner's ichiba id");
expect(RAKUTEN_MEASUREMENT_ID === "_RTLink156674", "measurement id is the owner's 計測ID");

expect(rakutenAffiliateUrl(ITEM) === wrapped(ITEM), `item URL wrapped as ${rakutenAffiliateUrl(ITEM)}`);
expect(rakutenAffiliateUrl(PRODUCT) === wrapped(PRODUCT), "product.rakuten.co.jp is wrapped");
expect(rakutenAffiliateUrl(SEARCH) === wrapped(SEARCH), "search.rakuten.co.jp is wrapped");
expect(new URL(rakutenAffiliateUrl(SEARCH)).searchParams.get("pc") === SEARCH, "query string is encoded inside pc and round-trips");
expect(new URL(rakutenAffiliateUrl(SEARCH)).searchParams.get("link_type") === "hybrid_url", "link_type=hybrid_url");

expect(rakutenAffiliateUrl("https://ITEM.RAKUTEN.CO.JP/Shop/Item/") === wrapped("https://ITEM.RAKUTEN.CO.JP/Shop/Item/"), "host match is case-insensitive and the original string is encoded");
expect(rakutenAffiliateUrl(AMAZON) === AMAZON, "Amazon is unchanged");
expect(rakutenAffiliateUrl(DIRECT) === DIRECT, "a maker shop is unchanged");
expect(rakutenAffiliateUrl("https://store.shopping.yahoo.co.jp/morinaga-milk/ppliptlemono01.html") === "https://store.shopping.yahoo.co.jp/morinaga-milk/ppliptlemono01.html", "Yahoo is unchanged");
expect(rakutenAffiliateUrl("not a url") === "not a url", "a non-URL is unchanged");
expect(rakutenAffiliateUrl("") === "", "an empty string is unchanged");

const once = rakutenAffiliateUrl(ITEM);
const twice = rakutenAffiliateUrl(once);
expect(twice === once, "an already-wrapped URL is not wrapped again");
expect(new URL(twice).searchParams.get("pc") === ITEM, "wrapping twice still points pc at the original item URL");
expect(!twice.includes(encodeURIComponent(once)), "the wrapped URL is not placed inside pc");

const drink: Drink = {
  slug: "sample",
  name: "sample",
  category: "柑橘・炭酸",
  stillUrl: "",
  place: "場",
  look: "見た目",
  size: "サイズ",
  taste: "味",
  officialUrl: DIRECT,
  amazonUrl: AMAZON,
  rakutenUrl: ITEM,
  directUrl: DIRECT,
  otherUrl: OTHER_RAKUTEN,
  generic: false,
  vessel: "",
  titleName: "",
};

const rows = storeRows(drink);
const href = (label: string) => rows.find((row) => row.label === label)?.href;

expect(href("Amazon") === AMAZON, "storeRows leaves Amazon alone");
expect(href("楽天") === wrapped(ITEM), "storeRows wraps the Rakuten column");
expect(href("公式ショップ") === DIRECT, "storeRows leaves a direct shop alone");
expect(href("その他の通販") === wrapped(OTHER_RAKUTEN), "storeRows wraps a Rakuten URL filed under another store");
expect(href("公式") === DIRECT, "storeRows leaves the brand site alone");

const map = outLinkMap(drink.slug, rows);
expect(map.slug === "sample", "the click map keeps the drink slug");
expect(map.links[wrapped(ITEM)] === "rakuten", "the wrapped Rakuten href is still recorded as rakuten");
expect(map.links[AMAZON] === "amazon", "Amazon is still recorded as amazon");
expect(map.links[wrapped(OTHER_RAKUTEN)] === "other", "a Rakuten URL in another column keeps its original store kind");
expect(rakutenDestinationUrl(wrapped(ITEM)) === ITEM, "click recording can recover the original Rakuten URL");
expect(new URL(rakutenDestinationUrl(wrapped(SEARCH))).hostname === "search.rakuten.co.jp", "the recorded host is the original store, not the affiliate gateway");
expect(rakutenDestinationUrl(AMAZON) === AMAZON, "a non-Rakuten click URL is unchanged");

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log("rakuten affiliate ok");
