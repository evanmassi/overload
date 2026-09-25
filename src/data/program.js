const lifts = ex => ({kind: "straight", ex});
const core = (...pairs) => ({kind: "core", name: "Core finisher", rounds: 2, ex: pairs.flat()});

export const PROGRAM = {
  A: {
    chest: {focus: "Chest & Back", sections: [
      lifts([
        {id: "flat_db_press", s: 4, r: "8-10"},
        {id: "pullup", s: 4, r: "AMRAP"},
        {id: "incline_db_press", s: 3, r: "10-12"},
        {id: "cs_db_row", s: 3, r: "10-12"},
        {id: "db_fly", s: 3, r: "12-15"},
        {id: "lat_pulldown", s: 3, r: "10-12"},
        {id: "db_pullover", s: 3, r: "12"},
        {id: "pushup_burnout", s: 3, r: "AMRAP"},
        {id: "db_shrug", s: 3, r: "12-15"}
      ]),
      core(
        [{id: "hanging_knee_raise", r: "12"}, {id: "plank", r: "45", unit: "sec"}],
        [{id: "bicycle_crunch", r: "20"}, {id: "side_plank", r: "30", unit: "sec"}],
        [{id: "russian_twist", r: "20"}, {id: "dead_bug", r: "12"}]
      )
    ], away: [
      lifts([
        {id: "archer_pushup", s: 4, r: "6-8"},
        {id: "door_frame_row", s: 4, r: "10-12"},
        {id: "pseudo_planche", s: 3, r: "8-10"},
        {id: "reverse_snow_angel", s: 3, r: "12"},
        {id: "wide_pushup", s: 3, r: "AMRAP"},
        {id: "superman", s: 3, r: "12"},
        {id: "pike_shrug", s: 3, r: "12"},
        {id: "pushup_burnout", s: 3, r: "AMRAP"}
      ]),
      core(
        [{id: "bicycle_crunch", r: "20"}, {id: "plank", r: "45", unit: "sec"}],
        [{id: "reverse_crunch", r: "15"}, {id: "side_plank", r: "30", unit: "sec"}],
        [{id: "v_up", r: "12"}, {id: "dead_bug", r: "12"}]
      )
    ]},
    legs: {focus: "Legs & Back", sections: [
      lifts([
        {id: "goblet_squat", s: 4, r: "10-12"},
        {id: "db_rdl", s: 4, r: "8-10"},
        {id: "back_extension", s: 3, r: "12"},
        {id: "bulgarian", s: 3, r: "10"},
        {id: "single_arm_row", s: 3, r: "10"},
        {id: "walking_lunge", s: 3, r: "12"},
        {id: "glute_bridge", s: 3, r: "15"},
        {id: "standing_calf", s: 4, r: "15-20"},
        {id: "hanging_leg_raise", s: 3, r: "AMRAP"}
      ]),
      core(
        [{id: "woodchop", r: "12"}, {id: "hollow_hold", r: "30", unit: "sec"}],
        [{id: "reverse_crunch", r: "15"}, {id: "shoulder_taps", r: "20"}],
        [{id: "decline_situp", r: "12"}, {id: "flutter_kicks", r: "40", unit: "sec"}]
      )
    ], away: [
      lifts([
        {id: "split_squat", s: 4, r: "12"},
        {id: "bw_sl_rdl", s: 4, r: "12"},
        {id: "superman", s: 3, r: "15"},
        {id: "bw_reverse_lunge", s: 3, r: "12"},
        {id: "door_frame_row", s: 3, r: "12"},
        {id: "sl_glute_bridge", s: 3, r: "15"},
        {id: "floor_calf_raise", s: 4, r: "15-20"},
        {id: "wall_sit", s: 3, r: "45", unit: "sec"}
      ]),
      core(
        [{id: "reverse_crunch", r: "15"}, {id: "hollow_hold", r: "30", unit: "sec"}],
        [{id: "shoulder_taps", r: "20"}, {id: "flutter_kicks", r: "40", unit: "sec"}],
        [{id: "v_up", r: "12"}, {id: "bird_dog", r: "12"}]
      )
    ]},
    arms: {focus: "Shoulders & Arms", sections: [
      lifts([
        {id: "seated_db_press", s: 4, r: "8-10"},
        {id: "lateral_raise", s: 4, r: "12-15"},
        {id: "ez_curl", s: 3, r: "10-12"},
        {id: "ez_skullcrusher", s: 3, r: "10-12"},
        {id: "hammer_curl", s: 3, r: "12"},
        {id: "oh_tri_ext", s: 3, r: "12"},
        {id: "rear_delt_fly", s: 3, r: "15"},
        {id: "cable_curl", s: 3, r: "15"}
      ]),
      core(
        [{id: "hanging_leg_raise", r: "10"}, {id: "pallof_press", r: "12"}],
        [{id: "v_up", r: "12"}, {id: "suitcase_carry", r: "40", unit: "sec"}],
        [{id: "ab_wheel", r: "10"}, {id: "bird_dog", r: "12"}]
      )
    ], away: [
      lifts([
        {id: "pike_pushup", s: 4, r: "8-10"},
        {id: "wall_lateral_press", s: 4, r: "30", unit: "sec"},
        {id: "door_frame_curl", s: 3, r: "10-12"},
        {id: "sphinx_pushup", s: 3, r: "10-12"},
        {id: "self_resisted_curl", s: 3, r: "10"},
        {id: "diamond_pushup", s: 3, r: "AMRAP"},
        {id: "reverse_snow_angel", s: 3, r: "15"},
        {id: "wall_handstand", s: 3, r: "30", unit: "sec"}
      ]),
      core(
        [{id: "v_up", r: "12"}, {id: "side_plank", r: "30", unit: "sec"}],
        [{id: "reverse_crunch", r: "15"}, {id: "shoulder_taps", r: "20"}],
        [{id: "hollow_rock", r: "20"}, {id: "bird_dog", r: "12"}]
      )
    ]}
  },
  B: {
    chest: {focus: "Chest & Back", sections: [
      lifts([
        {id: "incline_db_press", s: 4, r: "8-10"},
        {id: "chinup", s: 4, r: "AMRAP"},
        {id: "squeeze_press", s: 3, r: "12"},
        {id: "single_arm_row", s: 4, r: "10"},
        {id: "cs_db_row", s: 3, r: "12"},
        {id: "cable_crossover", s: 3, r: "15"},
        {id: "db_pullover", s: 3, r: "12"},
        {id: "feet_elev_pushup", s: 3, r: "AMRAP"},
        {id: "db_shrug", s: 3, r: "12-15"}
      ]),
      core(
        [{id: "toes_to_bar", r: "8"}, {id: "copenhagen", r: "20", unit: "sec"}],
        [{id: "cable_crunch", r: "15"}, {id: "mountain_climber", r: "40", unit: "sec"}],
        [{id: "db_side_bend", r: "15"}, {id: "hollow_rock", r: "20"}]
      )
    ], away: [
      lifts([
        {id: "pseudo_planche", s: 4, r: "8"},
        {id: "door_frame_row", s: 4, r: "12"},
        {id: "hand_release_pushup", s: 3, r: "AMRAP"},
        {id: "prone_ytw", s: 3, r: "10"},
        {id: "spiderman_pushup", s: 3, r: "10"},
        {id: "reverse_snow_angel", s: 3, r: "12"},
        {id: "pushup_burnout", s: 3, r: "AMRAP"},
        {id: "pike_shrug", s: 3, r: "15"}
      ]),
      core(
        [{id: "hollow_rock", r: "20"}, {id: "mountain_climber", r: "40", unit: "sec"}],
        [{id: "bicycle_crunch", r: "24"}, {id: "side_plank_reach", r: "30", unit: "sec"}],
        [{id: "reverse_crunch", r: "15"}, {id: "plank", r: "45", unit: "sec"}]
      )
    ]},
    legs: {focus: "Legs & Back", sections: [
      lifts([
        {id: "db_front_squat", s: 4, r: "8-10"},
        {id: "single_leg_rdl", s: 3, r: "10"},
        {id: "back_extension", s: 3, r: "12"},
        {id: "lateral_lunge", s: 3, r: "10"},
        {id: "seated_row", s: 4, r: "10-12"},
        {id: "reverse_lunge", s: 3, r: "12"},
        {id: "leg_curl", s: 3, r: "12"},
        {id: "seated_calf", s: 4, r: "20"},
        {id: "db_good_morning", s: 3, r: "12"}
      ]),
      core(
        [{id: "decline_situp", r: "12"}, {id: "side_plank_reach", r: "30", unit: "sec"}],
        [{id: "oblique_knee_raise", r: "10"}, {id: "weighted_dead_bug", r: "12"}],
        [{id: "plank_up_down", r: "12"}, {id: "flutter_kicks", r: "40", unit: "sec"}]
      )
    ], away: [
      lifts([
        {id: "pistol_squat", s: 4, r: "5"},
        {id: "bridge_walkout", s: 3, r: "8"},
        {id: "superman", s: 3, r: "12"},
        {id: "bw_lateral_lunge", s: 3, r: "10"},
        {id: "door_frame_row", s: 4, r: "10"},
        {id: "bw_reverse_lunge", s: 3, r: "12"},
        {id: "bw_sl_rdl", s: 3, r: "12"},
        {id: "floor_calf_raise", s: 4, r: "20"}
      ]),
      core(
        [{id: "bicycle_crunch", r: "20"}, {id: "side_plank_reach", r: "30", unit: "sec"}],
        [{id: "reverse_crunch", r: "12"}, {id: "dead_bug", r: "12"}],
        [{id: "plank_up_down", r: "12"}, {id: "flutter_kicks", r: "40", unit: "sec"}]
      )
    ]},
    arms: {focus: "Shoulders & Arms", sections: [
      lifts([
        {id: "standing_ohp", s: 4, r: "8-10"},
        {id: "arnold_press", s: 3, r: "10-12"},
        {id: "lateral_raise", s: 4, r: "15"},
        {id: "face_pull", s: 3, r: "15"},
        {id: "incline_curl", s: 3, r: "10-12"},
        {id: "close_grip_press", s: 3, r: "10"},
        {id: "concentration_curl", s: 3, r: "12"},
        {id: "bench_dip", s: 3, r: "AMRAP"}
      ]),
      core(
        [{id: "ab_wheel", r: "10"}, {id: "pallof_press", r: "12"}],
        [{id: "v_up", r: "15"}, {id: "farmer_carry", r: "45", unit: "sec"}],
        [{id: "reverse_crunch", r: "15"}, {id: "plank", r: "60", unit: "sec"}]
      )
    ], away: [
      lifts([
        {id: "wall_walk", s: 4, r: "5"},
        {id: "pike_pushup", s: 3, r: "10"},
        {id: "wall_lateral_press", s: 4, r: "30", unit: "sec"},
        {id: "prone_ytw", s: 3, r: "10"},
        {id: "door_frame_curl", s: 3, r: "12"},
        {id: "sphinx_pushup", s: 3, r: "12"},
        {id: "self_resisted_curl", s: 3, r: "10"},
        {id: "diamond_pushup", s: 3, r: "AMRAP"}
      ]),
      core(
        [{id: "v_up", r: "15"}, {id: "plank", r: "60", unit: "sec"}],
        [{id: "bicycle_crunch", r: "24"}, {id: "bird_dog", r: "12"}],
        [{id: "reverse_crunch", r: "15"}, {id: "side_plank", r: "40", unit: "sec"}]
      )
    ]}
  },
  C: {
    chest: {focus: "Chest & Back", sections: [
      lifts([
        {id: "flat_db_press", s: 5, r: "5-6"},
        {id: "wide_pullup", s: 4, r: "6-8"},
        {id: "incline_db_press", s: 3, r: "8-10"},
        {id: "incline_db_fly", s: 3, r: "12"},
        {id: "renegade_row", s: 3, r: "8"},
        {id: "db_pullover", s: 3, r: "12"},
        {id: "diamond_pushup", s: 3, r: "AMRAP"},
        {id: "db_shrug", s: 3, r: "12-15"}
      ]),
      core(
        [{id: "weighted_leg_raise", r: "10"}, {id: "hollow_hold", r: "40", unit: "sec"}],
        [{id: "woodchop", r: "12"}, {id: "bicycle_crunch", r: "24"}],
        [{id: "russian_twist", r: "24"}, {id: "side_plank", r: "40", unit: "sec"}]
      )
    ], away: [
      lifts([
        {id: "archer_pushup", s: 5, r: "5"},
        {id: "door_frame_row", s: 4, r: "8"},
        {id: "pseudo_planche", s: 3, r: "10"},
        {id: "superman", s: 3, r: "12"},
        {id: "diamond_pushup", s: 3, r: "AMRAP"},
        {id: "prone_ytw", s: 3, r: "8"},
        {id: "reverse_snow_angel", s: 3, r: "15"},
        {id: "pike_shrug", s: 3, r: "12"}
      ]),
      core(
        [{id: "v_up", r: "15"}, {id: "hollow_hold", r: "40", unit: "sec"}],
        [{id: "bicycle_crunch", r: "24"}, {id: "side_plank", r: "40", unit: "sec"}],
        [{id: "dead_bug", r: "15"}, {id: "plank", r: "60", unit: "sec"}]
      )
    ]},
    legs: {focus: "Legs & Back", sections: [
      lifts([
        {id: "bulgarian", s: 4, r: "8"},
        {id: "stiff_leg_dl", s: 4, r: "10"},
        {id: "back_extension", s: 3, r: "12"},
        {id: "sumo_squat", s: 3, r: "12"},
        {id: "hip_thrust", s: 4, r: "8-10"},
        {id: "inverted_row", s: 3, r: "AMRAP"},
        {id: "lateral_lunge", s: 3, r: "10"},
        {id: "single_leg_calf", s: 3, r: "15"},
        {id: "hanging_knee_twist", s: 3, r: "12"}
      ]),
      core(
        [{id: "toes_to_bar", r: "8"}, {id: "pallof_press", r: "15"}],
        [{id: "decline_situp", r: "10"}, {id: "bird_dog", r: "12"}],
        [{id: "suitcase_carry", r: "45", unit: "sec"}, {id: "dead_bug", r: "15"}]
      )
    ], away: [
      lifts([
        {id: "shrimp_squat", s: 4, r: "6-8"},
        {id: "bw_sl_rdl", s: 4, r: "12"},
        {id: "superman", s: 3, r: "15"},
        {id: "split_squat", s: 3, r: "15"},
        {id: "sl_glute_bridge", s: 4, r: "15"},
        {id: "door_frame_row", s: 3, r: "AMRAP"},
        {id: "cossack_squat", s: 3, r: "10"},
        {id: "floor_calf_raise", s: 3, r: "25"}
      ]),
      core(
        [{id: "v_up", r: "12"}, {id: "bird_dog", r: "12"}],
        [{id: "reverse_crunch", r: "15"}, {id: "side_plank", r: "40", unit: "sec"}],
        [{id: "dead_bug", r: "15"}, {id: "mountain_climber", r: "45", unit: "sec"}]
      )
    ]},
    arms: {focus: "Shoulders & Arms", sections: [
      lifts([
        {id: "push_press", s: 4, r: "6-8"},
        {id: "seated_lateral_raise", s: 4, r: "15"},
        {id: "ez_upright_row", s: 3, r: "12"},
        {id: "rear_delt_raise", s: 3, r: "15"},
        {id: "ez_21s", s: 3, r: "21"},
        {id: "ez_oh_ext", s: 3, r: "12"},
        {id: "cross_hammer_curl", s: 3, r: "12"},
        {id: "tri_kickback", s: 3, r: "15"}
      ]),
      core(
        [{id: "ab_wheel", r: "12"}, {id: "copenhagen", r: "25", unit: "sec"}],
        [{id: "cable_crunch", r: "15"}, {id: "mountain_climber", r: "45", unit: "sec"}],
        [{id: "v_up", r: "15"}, {id: "plank", r: "60", unit: "sec"}]
      )
    ], away: [
      lifts([
        {id: "pike_pushup", s: 4, r: "6-8"},
        {id: "wall_handstand", s: 3, r: "40", unit: "sec"},
        {id: "wall_lateral_press", s: 4, r: "40", unit: "sec"},
        {id: "reverse_snow_angel", s: 3, r: "15"},
        {id: "door_frame_curl", s: 3, r: "10"},
        {id: "sphinx_pushup", s: 3, r: "12"},
        {id: "self_resisted_curl", s: 3, r: "12"},
        {id: "pushup_burnout", s: 3, r: "AMRAP"}
      ]),
      core(
        [{id: "v_up", r: "15"}, {id: "hollow_hold", r: "40", unit: "sec"}],
        [{id: "mountain_climber", r: "45", unit: "sec"}, {id: "bird_dog", r: "12"}],
        [{id: "dead_bug", r: "15"}, {id: "plank", r: "60", unit: "sec"}]
      )
    ]}
  }
};
