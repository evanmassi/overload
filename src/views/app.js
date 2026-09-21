import {state} from "../store/state.js";
import {renderHistory} from "./history.js";
import {renderProgress} from "./progress.js";
import {setIdleRest} from "./timer.js";
import {byId} from "./dom.js";
import {nextRest} from "../store/session.js";
import {updateSaveBar} from "./saveBar.js";
import {renderLog} from "./log.js";

export function render(){
  const main = byId("main");
  main.innerHTML = "";
  if(state.view === "log") renderLog(main);
  else if(state.view === "history") renderHistory(main);
  else renderProgress(main);
  updateSaveBar();
  setIdleRest(nextRest());
  document.querySelectorAll(".tab").forEach(tab => {
    const here = tab.dataset.view === state.view;
    tab.setAttribute("aria-selected", String(here));
    tab.dataset.chosen = here ? "on" : "off";
  });
}
