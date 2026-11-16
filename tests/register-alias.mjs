import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(pathToFileURL(path.join(root, `${specifier.slice(2)}.ts`)).href, context);
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      // Extension-less relative imports (as the bundler allows) resolve to `.ts`.
      if (specifier.startsWith(".") && !path.extname(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
