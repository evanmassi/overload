import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {installDom, installStorage} from "./dom.mjs";
import {section, check, equal, report} from "./checks.mjs";

installDom();
installStorage();

const root = fileURLToPath(new URL("../", import.meta.url));
const at = (...parts) => path.join(root, ...parts);
const read = file => fs.readFileSync(file, "utf8");

function filesUnder(dir, extension){
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) return filesUnder(full, extension);
    return entry.name.endsWith(extension) ? [full] : [];
  });
}

const modules = fs.readdirSync(at("src")).filter(file => file.endsWith(".js"));
const sourceOf = file => read(at("src", file));

section("Every module loads");
const exportsByFile = {};
for(const file of modules){
  if(file === "main.js") continue;
  try{
    exportsByFile[file] = Object.keys(await import(new URL("../src/" + file, import.meta.url)));
    check(file.padEnd(18) + exportsByFile[file].length + " exports", true);
  }catch(err){
    check(file, false, err.message);
  }
}

section("Dead exports");
const testSource = filesUnder(at("test"), ".mjs").map(read).join("\n");
const dead = [];
for(const file in exportsByFile){
  const elsewhere = modules.filter(other => other !== file).map(sourceOf).join("\n") + "\n" + testSource;
  exportsByFile[file].filter(name => !new RegExp(`\\b${name}\\b`).test(elsewhere))
    .forEach(name => dead.push(file + " → " + name));
}
equal("every export is imported somewhere", dead, []);

section("Rendered classes");
const css = [at("style.css"), ...filesUnder(at("styles"), ".css")].map(read).join("\n");
const rendered = new Set();
const collect = (text, pattern, split) => {
  for(const match of text.matchAll(pattern))
    (split ? match[1].split(/\s+/) : [match[1]]).forEach(name => name && rendered.add(name));
};
for(const text of modules.map(sourceOf).concat(read(at("index.html")))){
  collect(text, /className\s*[=:]\s*"([^"]+)"/g, true);
  collect(text, /class="([^"$]+)"/g, true);
  collect(text, /classList\.(?:add|toggle)\("([^"]+)"/g, false);
}
const unstyled = [...rendered].sort().filter(name => !new RegExp("\\." + name + "[^a-zA-Z0-9_-]").test(css));
equal("every rendered class has a CSS rule", unstyled, []);

section("Service worker precache");
const assets = read(at("sw.js")).match(/const ASSETS = \[([\s\S]*?)\];/)[1];
const precached = [...assets.matchAll(/'\.\/([^']*)'/g)].map(match => match[1]);
const relative = file => path.relative(root, file).split(path.sep).join("/");
const shipped = ["", "index.html", "style.css", "manifest.json"].concat(
  [...filesUnder(at("src"), ".js"), ...filesUnder(at("styles"), ".css"), ...filesUnder(at("icons"), ".png")].map(relative));
equal("every shipped file is precached", shipped.filter(file => !precached.includes(file)), []);
equal("every precached file exists", precached.filter(file => !shipped.includes(file)), []);

process.exit(report() ? 0 : 1);
