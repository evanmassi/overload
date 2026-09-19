import {state, hydrate, subscribe, notify} from "./state.js";
import {loadDate, iso, flushNow} from "./session.js";
import {render} from "./render.js";
import {mountSheet} from "./sheet.js";
import {mountTimer} from "./timer.js";
import {mountSaveState} from "./savestate.js";
import {loadSoundPreference, unlockAudio} from "./sound.js";

const el = id => document.getElementById(id);

loadSoundPreference();
document.addEventListener("pointerdown", unlockAudio);

mountSaveState(el("status"));
mountTimer(el("timer"));
mountSheet(el("sheet"), el("sheettitle"), el("sheetbody"), el("sheetclose"), el("sheetback"));

el("tabs").addEventListener("click", event => {
  const tab = event.target.closest(".tab");
  if(!tab) return;
  state.view = tab.dataset.view;
  notify();
});

document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden") flushNow();
  else unlockAudio();
});
window.addEventListener("pagehide", flushNow);

subscribe(render);
hydrate();
loadDate(iso(new Date()));

const LOCAL_HOST = /^(localhost|127\.|\[?::1\]?$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
const isLocalDev = LOCAL_HOST.test(location.hostname);

if("serviceWorker" in navigator){
  if(isLocalDev){
    navigator.serviceWorker.getRegistrations()
      .then(all => all.forEach(one => one.unregister())).catch(() => {});
    if(window.caches) caches.keys().then(keys => keys.forEach(key => caches.delete(key))).catch(() => {});
  } else {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}
