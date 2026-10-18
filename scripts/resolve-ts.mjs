import { readFileSync } from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ERR_MODULE_NOT_FOUND") {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  }
  return nextResolve(specifier, context);
}

// Node refuses a JSON import that has no `type: json` attribute. Pages cannot
// accept the attribute, so the build check supplies the module here.
export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    const source = readFileSync(new URL(url), "utf8");
    return {
      format: "module",
      source: `export default JSON.parse(${JSON.stringify(source)})`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
