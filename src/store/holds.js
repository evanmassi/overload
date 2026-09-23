import {state, persistHolds} from "./state.js";
import {beatsLastTime} from "../rules/progression.js";

export function isHeld(id){ return !!state.holds[id]; }

export function holdExercise(id){
  state.holds[id] = 1;
  persistHolds();
}

export function releaseExercise(id){
  delete state.holds[id];
  persistHolds();
}

export function releaseIfBeaten(exercise, sets, prior){
  if(isHeld(exercise.id) && beatsLastTime(exercise, sets, prior)) releaseExercise(exercise.id);
}
