import {HOLD_RELEASE_MARGIN} from "../data/constants.js";
import {state, persistHolds} from "./state.js";
import {score} from "../rules/progression.js";

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

export function releaseIfBeaten(exercise, set, last){
  if(isHeld(exercise.id) && last && beatsHold(score(set, exercise.bw), score(last, exercise.bw)))
    releaseLift(exercise.id);
}
