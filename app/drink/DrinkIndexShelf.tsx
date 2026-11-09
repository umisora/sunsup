"use client";

import shelf from "@/data/drink-shelf.json";
import { DrinkShelf, type DrinkShelfItem } from "@/design-system/components/DrinkShelf/DrinkShelf";

const SHELVES: Record<string, readonly DrinkShelfItem[]> = shelf;

/**
 * Same DrinkShelf markup as the category pages. The catalog is imported here, not
 * received as props and not rendered as server children of Motion: either of those
 * copies every card into the RSC payload and pushes /drink/ over Googlebot's 2MB fetch.
 */
export function DrinkIndexShelf({
  id,
  count,
  opening = false,
  defer = false,
}: {
  id: string;
  count: number;
  opening?: boolean;
  defer?: boolean;
}) {
  const drinks = SHELVES[id];
  if (!drinks || drinks.length !== count) {
    throw new Error(`drink shelf ${id} does not match the catalog (${drinks?.length ?? 0} vs ${count})`);
  }
  return <DrinkShelf drinks={drinks} opening={opening} defer={defer} />;
}
