import {HOLD_RELEASE_MARGIN} from "./constants.js";
import {state, persistHolds} from "./state.js";

export function isHeld(id){ return !!state.holds[id]; }

export function holdLift(id){
  state.holds[id] = 1;
  persistHolds();
}

export function releaseLift(id){
  delete state.holds[id];
  persistHolds();
}

export function beatsHold(now, then){
  return then > 0 && now > then * (1 + HOLD_RELEASE_MARGIN);
}
