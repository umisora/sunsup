import rule from "../data/demote-rule.json";

/**
 * Drinks that stay listed but never open a shelf. The rule lives in data/demote-rule.json so the
 * export checks read the same lists: tonics and ginger beers, シャンメリー and メゾンペリエ シック, a winery
 * or wine grape in the name, and the stills judged by eye to read as wine (look), minus the drinks a
 * name rule catches whose still does not look like alcohol (allow). A demoted drink sorts to the end of its shelf, is never in a first row or a hero,
 * and never takes an office-entry lead.
 */
type DemoteRule = { id: string; why: string; name: string };

type Demotable = { slug: string; name: string };

const RULES = (rule.rules as DemoteRule[]).map((item) => ({ id: item.id, name: new RegExp(item.name, "i") }));

const LOOK = new Set<string>(Object.keys(rule.look));
const ALLOW = new Set<string>(Object.keys(rule.allow));

/** Rule ids that demote this drink; empty when it may lead. */
export function demoteReasons(drink: Demotable): string[] {
  const reasons = ALLOW.has(drink.slug) ? [] : RULES.filter((item) => item.name.test(drink.name)).map((item) => item.id);
  if (LOOK.has(drink.slug)) {
    reasons.push("look");
  }
  return reasons;
}

export function isDemoted(drink: Demotable): boolean {
  return demoteReasons(drink).length > 0;
}
