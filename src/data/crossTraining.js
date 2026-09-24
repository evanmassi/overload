const interval = (name, rounds, on, off, ex) => ({kind: "interval", name, rounds, on, off, ex});
const circuit = (name, rounds, off, ex) => ({kind: "circuit", name, rounds, off, ex});
const finish = (ex, off) => ({kind: "finish", name: "Finish", off: off || 60, ex});

const hold = (id, seconds, sets) => ({id, r: String(seconds), unit: "sec", s: sets});
const reps = (id, count) => ({id, r: String(count)});
const timed = (id, seconds) => ({id, r: String(seconds), unit: "sec"});
const machine = (id, minutes) => ({id, s: 1, r: String(minutes), unit: "min"});
const counted = id => ({id});

export const CROSS_TRAINING = {
  A: {
    conditioning: {focus: "Conditioning", sections: [
      interval("Dumbbells", 4, 40, 20, [
        counted("thruster"),
        counted("lateral_lunge"),
        counted("renegade_row"),
        counted("burpee_over_bells")
      ]),
      interval("Floor", 3, 45, 60, [
        counted("punch_out"),
        counted("jump_squat"),
        counted("mountain_climber"),
        counted("pushup_burnout")
      ]),
      finish([machine("stair_intervals", 8)])
    ], travel: {
      thruster: "backpack_thruster", lateral_lunge: "cossack_squat", renegade_row: "backpack_row",
      burpee_over_bells: "burpee", stair_intervals: "stairwell_climb"
    }},
    functional: {focus: "Functional", sections: [
      circuit("Dumbbells", 4, 30, [
        timed("farmer_carry", 40),
        reps("turkish_getup", 2),
        reps("single_arm_press", 8),
        reps("walking_lunge", 10)
      ]),
      circuit("Cables", 4, 30, [
        reps("pallof_press", 12),
        reps("single_arm_cable_row", 12),
        reps("cable_pull_through", 15)
      ]),
      finish([hold("dead_hang", 30, 2), hold("deep_squat_hold", 60, 2)])
    ], travel: {
      farmer_carry: "backpack_carry", single_arm_press: "pike_pushup", pallof_press: "side_plank",
      single_arm_cable_row: "backpack_row", cable_pull_through: "glute_bridge"
    }},
    mobility: {focus: "Mobility", sections: [
      circuit("Floor", 2, 15, [
        hold("hip_9090", 45),
        reps("cossack_squat", 8),
        hold("deep_squat_pry", 45),
        hold("couch_stretch", 45)
      ]),
      circuit("Bar & bench", 2, 15, [
        hold("dead_hang", 30),
        reps("thoracic_ext_bench", 10),
        reps("band_pull_apart", 15),
        reps("wall_slide", 10)
      ]),
      finish([machine("incline_walk", 15)])
    ], travel: {
      dead_hang: "childs_pose", band_pull_apart: "prone_ytw", incline_walk: "walk"
    }}
  },
  B: {
    conditioning: {focus: "Conditioning", sections: [
      interval("Dumbbells", 4, 40, 20, [
        counted("alt_snatch"),
        counted("goblet_squat"),
        counted("push_press"),
        counted("man_maker")
      ]),
      interval("Floor", 3, 45, 60, [
        counted("punch_out"),
        counted("skater_hop"),
        counted("plank_up_down"),
        counted("squat_thrust")
      ]),
      finish([machine("incline_power_walk", 10)])
    ], travel: {
      alt_snatch: "backpack_thruster", goblet_squat: "backpack_squat", push_press: "pike_pushup",
      man_maker: "burpee", incline_power_walk: "stairwell_climb"
    }},
    functional: {focus: "Functional", sections: [
      circuit("Dumbbells", 4, 30, [
        timed("suitcase_carry", 40),
        reps("single_leg_rdl", 8),
        reps("single_arm_floor_press", 10),
        reps("goblet_cossack", 6)
      ]),
      circuit("Cables", 4, 30, [
        reps("half_kneel_woodchop", 12),
        reps("face_pull", 15),
        reps("cable_rotation", 12)
      ]),
      finish([hold("bear_crawl", 30, 3), hold("hollow_hold", 30, 3)])
    ], travel: {
      suitcase_carry: "backpack_carry", single_arm_floor_press: "archer_pushup", goblet_cossack: "cossack_squat", half_kneel_woodchop: "bird_dog",
      face_pull: "prone_ytw", cable_rotation: "russian_twist"
    }},
    mobility: {focus: "Mobility", sections: [
      circuit("Floor", 2, 15, [
        hold("pigeon", 45),
        reps("worlds_greatest", 5),
        reps("cat_cow", 10),
        reps("adductor_rockback", 10)
      ]),
      circuit("Bar & bench", 2, 15, [
        reps("scapular_pullup", 8),
        reps("band_dislocate", 10),
        reps("prone_ytw", 8)
      ]),
      finish([machine("stair_easy", 12)])
    ], travel: {
      scapular_pullup: "scapular_pushup", band_dislocate: "wall_slide", stair_easy: "walk"
    }}
  },
  C: {
    conditioning: {focus: "Conditioning", sections: [
      interval("Dumbbells", 4, 40, 20, [
        counted("devil_press"),
        counted("reverse_lunge"),
        counted("hang_clean"),
        counted("db_bent_row")
      ]),
      interval("Floor", 3, 45, 60, [
        counted("punch_out"),
        counted("broad_jump"),
        counted("bicycle_crunch"),
        counted("hand_release_pushup")
      ]),
      finish([machine("stair_intervals_long", 10)])
    ], travel: {
      devil_press: "burpee", hang_clean: "backpack_thruster", db_bent_row: "backpack_row",
      stair_intervals_long: "stairwell_climb"
    }},
    functional: {focus: "Functional", sections: [
      circuit("Dumbbells", 4, 30, [
        timed("overhead_carry", 30),
        reps("goblet_cossack", 6),
        reps("clean_and_press", 6),
        reps("suitcase_deadlift", 8)
      ]),
      circuit("Cables", 4, 30, [
        timed("cable_antirotation_hold", 20),
        reps("half_kneel_pulldown", 10),
        reps("cable_crunch", 15)
      ]),
      finish([hold("copenhagen", 20, 2), hold("wall_sit", 45, 2)])
    ], travel: {
      overhead_carry: "backpack_carry", goblet_cossack: "cossack_squat", clean_and_press: "backpack_thruster",
      suitcase_deadlift: "single_leg_rdl", cable_antirotation_hold: "side_plank", half_kneel_pulldown: "backpack_row",
      cable_crunch: "v_up"
    }},
    mobility: {focus: "Mobility", sections: [
      circuit("Floor", 2, 15, [
        hold("frog_stretch", 45),
        reps("jefferson_curl", 8),
        reps("quadruped_t_rotation", 8),
        reps("ankle_rock", 10)
      ]),
      circuit("Bar & bench", 2, 15, [
        hold("active_hang", 20),
        reps("hanging_knee_raise", 8),
        reps("band_pull_apart", 15)
      ]),
      finish([machine("incline_walk", 15)])
    ], travel: {
      jefferson_curl: "standing_forward_fold", active_hang: "childs_pose", hanging_knee_raise: "dead_bug",
      band_pull_apart: "prone_ytw", incline_walk: "walk"
    }}
  }
};
