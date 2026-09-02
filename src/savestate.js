import {onStatus} from "./session.js";

const SAVE_LABEL = {saving: "Saving to this device", saved: "Saved on this device"};

export function mountSaveState(node){
  const paint = text => {
    node.className = "save " + (text === "saving" ? "saving" : "saved");
    node.title = SAVE_LABEL[text] || text;
    node.setAttribute("aria-label", node.title);
  };
  onStatus(paint);
  paint("saved");
}
