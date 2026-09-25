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
    ], away: [
      interval("Bodyweight", 4, 40, 20, [
        counted("air_squat"),
        counted("bw_reverse_lunge"),
        counted("hand_release_pushup"),
        counted("inchworm")
      ]),
      interval("Floor", 3, 45, 60, [
        counted("shadowbox"),
        counted("plank_up_down"),
        counted("mountain_climber"),
        counted("pushup_burnout")
      ]),
      finish([hold("bear_crawl", 40, 4)])
    ]},
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
    ], away: [
      circuit("Bodyweight", 4, 30, [
        timed("bear_crawl", 40),
        reps("inchworm", 6),
        reps("pike_pushup", 8),
        reps("bw_reverse_lunge", 10)
      ]),
      circuit("Door & floor", 4, 30, [
        timed("side_plank", 30),
        reps("door_frame_row", 12),
        reps("sl_glute_bridge", 12)
      ]),
      finish([hold("deep_squat_hold", 60, 2), hold("hollow_hold", 30, 2)])
    ]},
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
    ], away: [
      circuit("Floor", 2, 15, [
        hold("hip_9090", 45),
        reps("cossack_squat", 8),
        hold("deep_squat_pry", 45),
        hold("couch_stretch", 45)
      ]),
      circuit("Wall & floor", 2, 15, [
        hold("childs_pose", 30),
        reps("quadruped_t_rotation", 8),
        reps("prone_ytw", 10),
        reps("wall_slide", 10)
      ]),
      finish([hold("deep_squat_hold", 60, 2)])
    ]}
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
    ], away: [
      interval("Bodyweight", 4, 40, 20, [
        counted("air_squat"),
        counted("bw_lateral_lunge"),
        counted("pike_pushup"),
        counted("shoulder_taps")
      ]),
      interval("Floor", 3, 45, 60, [
        counted("shadowbox"),
        counted("plank_up_down"),
        counted("mountain_climber"),
        counted("inchworm")
      ]),
      finish([hold("wall_sit", 45, 3)])
    ]},
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
    ], away: [
      circuit("Bodyweight", 4, 30, [
        timed("crab_walk", 40),
        reps("bw_sl_rdl", 8),
        reps("archer_pushup", 8),
        reps("cossack_squat", 6)
      ]),
      circuit("Door & floor", 4, 30, [
        reps("door_frame_row", 12),
        reps("bird_dog", 12),
        reps("dead_bug", 12)
      ]),
      finish([hold("bear_crawl", 30, 3), hold("hollow_hold", 30, 3)])
    ]},
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
    ], away: [
      circuit("Floor", 2, 15, [
        hold("pigeon", 45),
        reps("worlds_greatest", 5),
        reps("cat_cow", 10),
        reps("adductor_rockback", 10)
      ]),
      circuit("Wall & floor", 2, 15, [
        reps("scapular_pushup", 8),
        reps("wall_slide", 10),
        reps("prone_ytw", 8)
      ]),
      finish([hold("childs_pose", 60, 2)])
    ]}
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
    ], away: [
      interval("Bodyweight", 4, 40, 20, [
        counted("air_squat"),
        counted("spiderman_pushup"),
        counted("inchworm"),
        counted("bw_lateral_lunge")
      ]),
      interval("Floor", 3, 45, 60, [
        counted("shadowbox"),
        counted("mountain_climber"),
        counted("bicycle_crunch"),
        counted("hand_release_pushup")
      ]),
      finish([hold("bear_crawl", 45, 4)])
    ]},
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
    ], away: [
      circuit("Bodyweight", 4, 30, [
        reps("wall_walk", 4),
        reps("cossack_squat", 6),
        reps("spiderman_pushup", 8),
        reps("bw_sl_rdl", 8)
      ]),
      circuit("Door & floor", 4, 30, [
        timed("side_plank", 20),
        reps("door_frame_row", 10),
        reps("v_up", 12)
      ]),
      finish([hold("side_plank_reach", 20, 2), hold("wall_sit", 45, 2)])
    ]},
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
    ], away: [
      circuit("Floor", 2, 15, [
        hold("frog_stretch", 45),
        hold("standing_forward_fold", 45),
        reps("quadruped_t_rotation", 8),
        reps("ankle_rock", 10)
      ]),
      circuit("Wall & floor", 2, 15, [
        hold("childs_pose", 20),
        reps("dead_bug", 8),
        reps("reverse_snow_angel", 15)
      ]),
      finish([hold("deep_squat_hold", 60, 2)])
    ]}
  }
};
