const interval = (name, rounds, on, off, ex) => ({name, rounds, on, off, ex});
const circuit = (name, rounds, off, ex) => ({name, rounds, off, ex});
const finish = (ex, off) => ({name: "Finish", off: off || 60, ex});

const hold = (id, n, seconds, sets) => ({id, n, r: String(seconds), unit: "sec", bw: 1, s: sets});
const reps = (id, n, count) => ({id, n, r: String(count), bw: 1});
const loaded = (id, n, count) => ({id, n, r: String(count)});
const timed = (id, n, seconds) => ({id, n, r: String(seconds), unit: "sec"});
const machine = (id, n, minutes) => ({id, n, s: 1, r: String(minutes), unit: "min", bw: 1});
const move = (id, n) => ({id, n});

export const OFFDAYS = {
  A: {
    conditioning: {focus: "Cardio", sections: [
      interval("Dumbbells", 4, 40, 20, [
        move("thruster", "DB Thruster"),
        move("bench_stepover", "Bench Step-over"),
        move("renegade_row", "Renegade Row"),
        move("burpee_over_bells", "Burpee over the Bells")
      ]),
      interval("Floor", 3, 45, 60, [
        move("punch_out", "Weighted Punch-out"),
        move("jump_squat", "Jump Squat"),
        move("mountain_climber", "Mountain Climbers"),
        move("pushup_burnout", "Push-ups")
      ]),
      finish([machine("stair_intervals", "Stair Intervals", 8)])
    ], travel: {
      thruster: "backpack_thruster", bench_stepover: "chair_stepup", renegade_row: "backpack_row",
      burpee_over_bells: "burpee", stair_intervals: "stairwell_climb"
    }},
    functional: {focus: "Function", sections: [
      circuit("Dumbbells", 4, 30, [
        timed("farmer_carry", "Farmer Carry", 40),
        loaded("turkish_getup", "Turkish Get-up", 2),
        loaded("single_arm_press", "Single-arm DB Press", 8),
        loaded("walking_lunge", "DB Walking Lunge", 10)
      ]),
      circuit("Cables", 4, 30, [
        loaded("pallof_press", "Pallof Press", 12),
        loaded("single_arm_cable_row", "Single-arm Cable Row", 12),
        loaded("cable_pull_through", "Cable Pull-through", 15)
      ]),
      finish([hold("dead_hang", "Dead Hang", 30, 2), hold("deep_squat_hold", "Deep Squat Hold", 60, 2)])
    ], travel: {
      farmer_carry: "backpack_carry", single_arm_press: "pike_pushup", pallof_press: "side_plank",
      single_arm_cable_row: "backpack_row", cable_pull_through: "glute_bridge"
    }},
    mobility: {focus: "Mobility", sections: [
      circuit("Floor", 2, 15, [
        hold("hip_9090", "90/90 Hip Switch", 45),
        reps("cossack_squat", "Cossack Squat", 8),
        hold("deep_squat_pry", "Deep Squat Pry", 45),
        hold("couch_stretch", "Couch Stretch", 45)
      ]),
      circuit("Bar & bench", 2, 15, [
        hold("dead_hang", "Dead Hang", 30),
        reps("thoracic_ext_bench", "Bench Thoracic Stretch", 10),
        reps("band_pull_apart", "Band Pull-apart", 15),
        reps("wall_slide", "Wall Slide", 10)
      ]),
      finish([machine("incline_walk", "Incline Walk", 15)])
    ], travel: {
      dead_hang: "childs_pose", band_pull_apart: "prone_ytw", incline_walk: "walk"
    }}
  },
  B: {
    conditioning: {focus: "Cardio", sections: [
      interval("Dumbbells", 4, 40, 20, [
        move("alt_snatch", "Alternating DB Snatch"),
        move("goblet_squat", "DB Goblet Squat"),
        move("push_press", "DB Push Press"),
        move("man_maker", "Man Maker")
      ]),
      interval("Floor", 3, 45, 60, [
        move("punch_out", "Weighted Punch-out"),
        move("skater_hop", "Skater Hop"),
        move("plank_up_down", "Plank Up-Downs"),
        move("squat_thrust", "Squat Thrust")
      ]),
      finish([machine("incline_power_walk", "Incline Power Walk", 10)])
    ], travel: {
      alt_snatch: "backpack_thruster", goblet_squat: "backpack_squat", push_press: "pike_pushup",
      man_maker: "burpee", incline_power_walk: "stairwell_climb"
    }},
    functional: {focus: "Function", sections: [
      circuit("Dumbbells", 4, 30, [
        timed("suitcase_carry", "Suitcase Carry", 40),
        loaded("single_leg_rdl", "Single-leg DB RDL", 8),
        loaded("single_arm_floor_press", "Single-arm Floor Press", 10),
        loaded("db_step_up", "DB Step-up", 10)
      ]),
      circuit("Cables", 4, 30, [
        loaded("half_kneel_woodchop", "Half-kneeling Woodchop", 12),
        loaded("face_pull", "Face Pull", 15),
        loaded("cable_rotation", "Cable Rotation", 12)
      ]),
      finish([hold("bear_crawl", "Bear Crawl", 30, 3), hold("hollow_hold", "Hollow Body Hold", 30, 3)])
    ], travel: {
      suitcase_carry: "backpack_carry", single_arm_floor_press: "archer_pushup", half_kneel_woodchop: "bird_dog",
      face_pull: "prone_ytw", cable_rotation: "russian_twist"
    }},
    mobility: {focus: "Mobility", sections: [
      circuit("Floor", 2, 15, [
        hold("pigeon", "Pigeon", 45),
        reps("worlds_greatest", "World's Greatest", 5),
        reps("cat_cow", "Cat-Cow", 10),
        reps("adductor_rockback", "Adductor Rock-back", 10)
      ]),
      circuit("Bar & bench", 2, 15, [
        reps("scapular_pullup", "Scapular Pull-up", 8),
        reps("band_dislocate", "Band Dislocate", 10),
        reps("prone_ytw", "Prone Y-T-W", 8)
      ]),
      finish([machine("stair_easy", "Stair Machine · easy", 12)])
    ], travel: {
      scapular_pullup: "scapular_pushup", band_dislocate: "wall_slide", stair_easy: "walk"
    }}
  },
  C: {
    conditioning: {focus: "Cardio", sections: [
      interval("Dumbbells", 4, 40, 20, [
        move("devil_press", "Devil Press"),
        move("reverse_lunge", "DB Reverse Lunge"),
        move("hang_clean", "DB Hang Clean"),
        move("db_bent_row", "DB Bent-over Row")
      ]),
      interval("Floor", 3, 45, 60, [
        move("punch_out", "Weighted Punch-out"),
        move("broad_jump", "Broad Jump"),
        move("bicycle_crunch", "Bicycle Crunch"),
        move("hand_release_pushup", "Hand-release Push-up")
      ]),
      finish([machine("stair_intervals_long", "Long Stair Intervals", 10)])
    ], travel: {
      devil_press: "burpee", hang_clean: "backpack_thruster", db_bent_row: "backpack_row",
      stair_intervals_long: "stairwell_climb"
    }},
    functional: {focus: "Function", sections: [
      circuit("Dumbbells", 4, 30, [
        timed("overhead_carry", "Overhead Carry", 30),
        loaded("goblet_cossack", "Goblet Cossack Squat", 6),
        loaded("clean_and_press", "DB Clean & Press", 6),
        loaded("suitcase_deadlift", "Suitcase Deadlift", 8)
      ]),
      circuit("Cables", 4, 30, [
        timed("cable_antirotation_hold", "Anti-rotation Hold", 20),
        loaded("half_kneel_pulldown", "Half-kneel Pulldown", 10),
        loaded("cable_crunch", "Cable Crunch", 15)
      ]),
      finish([hold("copenhagen", "Copenhagen Plank", 20, 2), hold("wall_sit", "Wall Sit", 45, 2)])
    ], travel: {
      overhead_carry: "backpack_carry", goblet_cossack: "cossack_squat", clean_and_press: "backpack_thruster",
      suitcase_deadlift: "single_leg_rdl", cable_antirotation_hold: "side_plank", half_kneel_pulldown: "backpack_row",
      cable_crunch: "v_up"
    }},
    mobility: {focus: "Mobility", sections: [
      circuit("Floor", 2, 15, [
        hold("frog_stretch", "Frog Stretch", 45),
        loaded("jefferson_curl", "Jefferson Curl", 8),
        reps("quadruped_t_rotation", "Thoracic Rotation", 8),
        reps("ankle_rock", "Ankle Rock", 10)
      ]),
      circuit("Bar & bench", 2, 15, [
        hold("active_hang", "Active Hang", 20),
        reps("hanging_knee_raise", "Slow Knee Raise", 8),
        reps("band_pull_apart", "Band Pull-apart", 15)
      ]),
      finish([machine("incline_walk", "Incline Walk", 15)])
    ], travel: {
      jefferson_curl: "standing_forward_fold", active_hang: "childs_pose", hanging_knee_raise: "dead_bug",
      band_pull_apart: "prone_ytw", incline_walk: "walk"
    }}
  }
};
