import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const file = resolve(
  import.meta.dirname,
  "../node_modules/nuxt/dist/pages/runtime/plugins/check-if-page-unused.js",
);

if (!existsSync(file)) process.exit(0);

let content = readFileSync(file, "utf-8");

if (content.includes("export default plugin;")) process.exit(0);

content = content.replace(
  "export { NESTED_PAGE_CONFIRMATION_DELAY, plugin as default, findUnrenderedNestedPage };",
  "export default plugin;\nexport { NESTED_PAGE_CONFIRMATION_DELAY, findUnrenderedNestedPage };",
);

writeFileSync(file, content, "utf-8");
