import rule from "../data/demote-rule.json";

/**
 * Drinks that stay listed but never open a shelf. The rule lives in data/demote-rule.json so the
 * export checks read the same patterns: tonics and ginger beers, シャンメリー and メゾンペリエ シック,
 * and bottles that read as wine (wine words or grape names, dark red liquid in glass, red liquid in a
 * large bottle). A demoted drink sorts to the end of its shelf, is never in a first row or a hero,
 * and never takes an office-entry lead.
 */
type DemoteRule = { id: string; why: string; name?: string; look?: string; vessels?: string[] };

type Demotable = { slug: string; name: string; look: string; vessel: string };

const RULES = (rule.rules as DemoteRule[]).map((item) => ({
  id: item.id,
  name: item.name ? new RegExp(item.name, "i") : undefined,
  look: item.look ? new RegExp(item.look, "i") : undefined,
  vessels: item.vessels,
}));

const JUDGED = new Set<string>(rule.slugs as string[]);

/** Rule ids that demote this drink; empty when it may lead. */
export function demoteReasons(drink: Demotable): string[] {
  const reasons = RULES.filter((item) => {
    if (item.vessels && !item.vessels.includes(drink.vessel)) {
      return false;
    }
    return Boolean(item.name?.test(drink.name) || item.look?.test(drink.look));
  }).map((item) => item.id);
  if (JUDGED.has(drink.slug)) {
    reasons.push("judged");
  }
  return reasons;
}

export function isDemoted(drink: Demotable): boolean {
  return demoteReasons(drink).length > 0;
}
