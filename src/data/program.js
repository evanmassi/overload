export const PROGRAM = {
  A: {
    chest: {focus:"Chest & Back", ex:[
      {id:"flat_db_press", s:4, r:"8-10"},
      {id:"pullup", s:4, r:"AMRAP"},
      {id:"incline_db_press", s:3, r:"10-12"},
      {id:"cs_db_row", s:3, r:"10-12"},
      {id:"db_fly", s:3, r:"12-15"},
      {id:"lat_pulldown", s:3, r:"10-12"},
      {id:"db_pullover", s:3, r:"12"},
      {id:"pushup_burnout", s:3, r:"AMRAP"},
      {id:"db_shrug", s:3, r:"12-15"}
    ], core:[
      [{id:"hanging_knee_raise", s:2, r:"12"},
       {id:"plank", s:2, r:"45", unit:"sec"}],
      [{id:"bicycle_crunch", s:2, r:"20"},
       {id:"side_plank", s:2, r:"30", unit:"sec"}],
      [{id:"russian_twist", s:2, r:"20"},
       {id:"dead_bug", s:2, r:"12"}]
    ]},
    legs: {focus:"Legs & Back", ex:[
      {id:"goblet_squat", s:4, r:"10-12"},
      {id:"db_rdl", s:4, r:"8-10"},
      {id:"back_extension", s:3, r:"12"},
      {id:"bulgarian", s:3, r:"10"},
      {id:"single_arm_row", s:3, r:"10"},
      {id:"walking_lunge", s:3, r:"12"},
      {id:"glute_bridge", s:3, r:"15"},
      {id:"standing_calf", s:4, r:"15-20"},
      {id:"hanging_leg_raise", s:3, r:"AMRAP"}
    ], core:[
      [{id:"woodchop", s:2, r:"12"},
       {id:"hollow_hold", s:2, r:"30", unit:"sec"}],
      [{id:"reverse_crunch", s:2, r:"15"},
       {id:"shoulder_taps", s:2, r:"20"}],
      [{id:"decline_situp", s:2, r:"12"},
       {id:"flutter_kicks", s:2, r:"40", unit:"sec"}]
    ]},
    arms: {focus:"Shoulders & Arms", ex:[
      {id:"seated_db_press", s:4, r:"8-10"},
      {id:"lateral_raise", s:4, r:"12-15"},
      {id:"ez_curl", s:3, r:"10-12"},
      {id:"ez_skullcrusher", s:3, r:"10-12"},
      {id:"hammer_curl", s:3, r:"12"},
      {id:"oh_tri_ext", s:3, r:"12"},
      {id:"rear_delt_fly", s:3, r:"15"},
      {id:"cable_curl", s:3, r:"15"}
    ], core:[
      [{id:"hanging_leg_raise", s:2, r:"10"},
       {id:"pallof_press", s:2, r:"12"}],
      [{id:"v_up", s:2, r:"12"},
       {id:"suitcase_carry", s:2, r:"40", unit:"sec"}],
      [{id:"ab_wheel", s:2, r:"10"},
       {id:"bird_dog", s:2, r:"12"}]
    ]}
  },
  B: {
    chest: {focus:"Chest & Back", ex:[
      {id:"incline_db_press", s:4, r:"8-10"},
      {id:"chinup", s:4, r:"AMRAP"},
      {id:"squeeze_press", s:3, r:"12"},
      {id:"single_arm_row", s:4, r:"10"},
      {id:"cs_db_row", s:3, r:"12"},
      {id:"cable_crossover", s:3, r:"15"},
      {id:"db_pullover", s:3, r:"12"},
      {id:"feet_elev_pushup", s:3, r:"AMRAP"},
      {id:"db_shrug", s:3, r:"12-15"}
    ], core:[
      [{id:"toes_to_bar", s:2, r:"8"},
       {id:"copenhagen", s:2, r:"20", unit:"sec"}],
      [{id:"cable_crunch", s:2, r:"15"},
       {id:"mountain_climber", s:2, r:"40", unit:"sec"}],
      [{id:"db_side_bend", s:2, r:"15"},
       {id:"hollow_rock", s:2, r:"20"}]
    ]},
    legs: {focus:"Legs & Back", ex:[
      {id:"db_front_squat", s:4, r:"8-10"},
      {id:"single_leg_rdl", s:3, r:"10"},
      {id:"back_extension", s:3, r:"12"},
      {id:"db_step_up", s:3, r:"10"},
      {id:"seated_row", s:4, r:"10-12"},
      {id:"reverse_lunge", s:3, r:"12"},
      {id:"leg_curl", s:3, r:"12"},
      {id:"seated_calf", s:4, r:"20"},
      {id:"db_good_morning", s:3, r:"12"}
    ], core:[
      [{id:"decline_situp", s:2, r:"12"},
       {id:"side_plank_reach", s:2, r:"30", unit:"sec"}],
      [{id:"oblique_knee_raise", s:2, r:"10"},
       {id:"weighted_dead_bug", s:2, r:"12"}],
      [{id:"plank_up_down", s:2, r:"12"},
       {id:"flutter_kicks", s:2, r:"40", unit:"sec"}]
    ]},
    arms: {focus:"Shoulders & Arms", ex:[
      {id:"standing_ohp", s:4, r:"8-10"},
      {id:"arnold_press", s:3, r:"10-12"},
      {id:"lateral_raise", s:4, r:"15"},
      {id:"face_pull", s:3, r:"15"},
      {id:"incline_curl", s:3, r:"10-12"},
      {id:"close_grip_press", s:3, r:"10"},
      {id:"concentration_curl", s:3, r:"12"},
      {id:"bench_dip", s:3, r:"AMRAP"}
    ], core:[
      [{id:"ab_wheel", s:2, r:"10"},
       {id:"pallof_press", s:2, r:"12"}],
      [{id:"v_up", s:2, r:"15"},
       {id:"farmer_carry", s:2, r:"45", unit:"sec"}],
      [{id:"reverse_crunch", s:2, r:"15"},
       {id:"plank", s:2, r:"60", unit:"sec"}]
    ]}
  },
  C: {
    chest: {focus:"Chest & Back", ex:[
      {id:"flat_db_press", s:5, r:"5-6"},
      {id:"wide_pullup", s:4, r:"6-8"},
      {id:"incline_db_press", s:3, r:"8-10"},
      {id:"incline_db_fly", s:3, r:"12"},
      {id:"renegade_row", s:3, r:"8"},
      {id:"db_pullover", s:3, r:"12"},
      {id:"diamond_pushup", s:3, r:"AMRAP"},
      {id:"db_shrug", s:3, r:"12-15"}
    ], core:[
      [{id:"weighted_leg_raise", s:2, r:"10"},
       {id:"hollow_hold", s:2, r:"40", unit:"sec"}],
      [{id:"woodchop", s:2, r:"12"},
       {id:"bicycle_crunch", s:2, r:"24"}],
      [{id:"russian_twist", s:2, r:"24"},
       {id:"side_plank", s:2, r:"40", unit:"sec"}]
    ]},
    legs: {focus:"Legs & Back", ex:[
      {id:"bulgarian", s:4, r:"8"},
      {id:"stiff_leg_dl", s:4, r:"10"},
      {id:"back_extension", s:3, r:"12"},
      {id:"sumo_squat", s:3, r:"12"},
      {id:"hip_thrust", s:4, r:"8-10"},
      {id:"inverted_row", s:3, r:"AMRAP"},
      {id:"lateral_lunge", s:3, r:"10"},
      {id:"single_leg_calf", s:3, r:"15"},
      {id:"hanging_knee_twist", s:3, r:"12"}
    ], core:[
      [{id:"toes_to_bar", s:2, r:"8"},
       {id:"pallof_press", s:2, r:"15"}],
      [{id:"decline_situp", s:2, r:"10"},
       {id:"bird_dog", s:2, r:"12"}],
      [{id:"suitcase_carry", s:2, r:"45", unit:"sec"},
       {id:"dead_bug", s:2, r:"15"}]
    ]},
    arms: {focus:"Shoulders & Arms", ex:[
      {id:"push_press", s:4, r:"6-8"},
      {id:"seated_lateral_raise", s:4, r:"15"},
      {id:"ez_upright_row", s:3, r:"12"},
      {id:"rear_delt_raise", s:3, r:"15"},
      {id:"ez_21s", s:3, r:"21"},
      {id:"ez_oh_ext", s:3, r:"12"},
      {id:"cross_hammer_curl", s:3, r:"12"},
      {id:"tri_kickback", s:3, r:"15"}
    ], core:[
      [{id:"ab_wheel", s:2, r:"12"},
       {id:"copenhagen", s:2, r:"25", unit:"sec"}],
      [{id:"cable_crunch", s:2, r:"15"},
       {id:"mountain_climber", s:2, r:"45", unit:"sec"}],
      [{id:"v_up", s:2, r:"15"},
       {id:"plank", s:2, r:"60", unit:"sec"}]
    ]}
  }
};
