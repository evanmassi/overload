import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const suites = ["modules.mjs", "run.mjs", "render.mjs"];
let failed = 0;

for(const suite of suites){
  console.log("\n" + "=".repeat(50) + "\n" + suite + "\n" + "=".repeat(50));
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(suite, import.meta.url))], {stdio: "inherit"});
  if(result.status !== 0) failed++;
}

console.log("\n" + (failed ? `${failed} suite(s) failed` : "all suites passed"));
process.exit(failed ? 1 : 0);
