import {spawnSync} from "node:child_process";

const suites = ["modules.mjs", "run.mjs", "render.mjs"];
let failed = 0;

for(const suite of suites){
  console.log("\n" + "=".repeat(50) + "\n" + suite + "\n" + "=".repeat(50));
  const result = spawnSync(process.execPath, [new URL(suite, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")], {stdio: "inherit"});
  if(result.status !== 0) failed++;
}

console.log("\n" + (failed ? `${failed} suite(s) failed` : "all suites passed"));
process.exit(failed ? 1 : 0);
