import {saveStatus} from "../store/session.js";

const SAVE_LABEL = {saving: "Saving to this device", saved: "Saved on this device"};

export function mountSaveStatus(node){
  const paint = status => {
    node.className = "save " + status;
    node.title = SAVE_LABEL[status];
    node.setAttribute("aria-label", node.title);
  };
  saveStatus.subscribe(paint);
  paint("saved");
}
