// Writes public/llms.txt before `next build` copies public/ into the static export.
// Pages come from the sitemap path lists. Titles and descriptions are the ones
// those pages already render. Drink detail URLs stay out.
import { renameSync, writeFileSync } from "node:fs";
import { llmsText } from "../lib/llms.ts";

const path = "public/llms.txt";
const body = llmsText();
const temp = `${path}.${process.pid}.tmp`;
writeFileSync(temp, body);
renameSync(temp, path);
const links = body.split("\n").filter((line) => line.startsWith("- ")).length;
console.log(`[llms] wrote ${path} (${links} links, ${Buffer.byteLength(body)} bytes)`);
