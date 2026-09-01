import fs from "node:fs";
import path from "node:path";

const SRC = new URL("../src/", import.meta.url);
const dir = path.fromFileURL ? path.fromFileURL(SRC) : new URL("../src/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

const noop = () => {};
const element = () => ({
  style: {}, dataset: {}, classList: {add: noop, remove: noop, toggle: noop, contains: () => false},
  append: noop, appendChild: noop, remove: noop, addEventListener: noop, setAttribute: noop,
  querySelector: () => element(), querySelectorAll: () => [], scrollTo: noop,
  innerHTML: "", textContent: "", value: "", hidden: false, scrollTop: 0
});

globalThis.document = {
  getElementById: () => element(),
  createElement: element,
  createElementNS: element,
  querySelectorAll: () => [],
  addEventListener: noop,
  body: element(),
  activeElement: null,
  visibilityState: "visible"
};
globalThis.window = {addEventListener: noop, scrollTo: noop};
if(!globalThis.navigator) Object.defineProperty(globalThis, "navigator", {value: {}, configurable: true});
globalThis.Blob = function(){};
globalThis.URL.createObjectURL = () => "blob:";
globalThis.URL.revokeObjectURL = noop;
globalThis.FileReader = function(){};
if(!globalThis.localStorage){
  const store = {};
  globalThis.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for(const k in store) delete store[k]; }
  };
}

let failed = 0;
const exportsByFile = {};

for(const file of files){
  if(file === "main.js") continue;
  try{
    const mod = await import(new URL(file, SRC));
    exportsByFile[file] = Object.keys(mod);
    console.log("  PASS  " + file.padEnd(18) + Object.keys(mod).length + " exports");
  }catch(err){
    failed++;
    console.log("  FAIL  " + file.padEnd(18) + err.message);
  }
}

console.log("\nDead exports (declared, imported nowhere):");
const allSource = files.map(f => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
const testSource = fs.readdirSync(path.join(dir, "..", "test"))
  .filter(f => f.endsWith(".mjs"))
  .map(f => fs.readFileSync(path.join(dir, "..", "test", f), "utf8")).join("\n");

let dead = 0;
for(const file in exportsByFile){
  for(const name of exportsByFile[file]){
    const importedSomewhere = new RegExp(`\\b${name}\\b`).test(
      allSource.split(fs.readFileSync(path.join(dir, file), "utf8")).join("")
    );
    const usedInTests = new RegExp(`\\b${name}\\b`).test(testSource);
    if(!importedSomewhere && !usedInTests){
      console.log("  " + file + " → " + name);
      dead++;
    }
  }
}
if(!dead) console.log("  none");

process.exit(failed ? 1 : 0);
