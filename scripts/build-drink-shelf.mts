// Slim shelf for /drink/. The page renders it from a client module so the 898 cards
// are not repeated inside the RSC flight payload. Next writes this file while loading
// next.config, before it compiles the page that imports it.
import { writeFileSync } from "node:fs";
import { drinkGroups } from "../lib/drinks.ts";

type ShelfDrink = {
  slug: string;
  name: string;
  size: string;
  stillUrl: string;
};

const shelf: Record<string, ShelfDrink[]> = {};
const seen = new Set<string>();

for (const group of drinkGroups()) {
  if (shelf[group.id]) {
    throw new Error(`duplicate drink shelf ${group.id}`);
  }
  shelf[group.id] = group.drinks.map((drink) => {
    if (seen.has(drink.slug)) {
      throw new Error(`drink shelf lists ${drink.slug} twice`);
    }
    seen.add(drink.slug);
    return {
      slug: drink.slug,
      name: drink.name,
      size: drink.size,
      stillUrl: drink.stillUrl,
    };
  });
}

writeFileSync("data/drink-shelf.json", JSON.stringify(shelf));
console.log(`[drink-shelf] ${seen.size} drinks in ${Object.keys(shelf).length} shelves`);
