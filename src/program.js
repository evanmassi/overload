export const PROGRAM = {
  A: {
    chest: {focus:"Chest & Back", cue:"Volume week. Leave 1-2 reps in the tank on the first set.", ex:[
      {id:"flat_db_press", n:"Flat DB Bench Press", s:4, r:"8-10"},
      {id:"pullup", n:"Pull-ups", s:4, r:"AMRAP", bw:1},
      {id:"incline_db_press", n:"Incline DB Press", s:3, r:"10-12"},
      {id:"cs_db_row", n:"Chest-Supported DB Row", s:3, r:"10-12"},
      {id:"db_fly", n:"Flat DB Flye", s:3, r:"12-15"},
      {id:"lat_pulldown", n:"Wide-grip Lat Pulldown", s:3, r:"10-12"},
      {id:"db_pullover", n:"DB Pullover", s:3, r:"12"},
      {id:"pushup_burnout", n:"Push-ups to Failure", s:3, r:"AMRAP", bw:1}
    ], core:[
      [{id:"hanging_knee_raise", n:"Hanging Knee Raise", s:2, r:"12", bw:1},
       {id:"plank", n:"Plank", s:2, r:"45", unit:"sec", bw:1}],
      [{id:"bicycle_crunch", n:"Bicycle Crunch", s:2, r:"20", bw:1},
       {id:"side_plank", n:"Side Plank", s:2, r:"30", unit:"sec", bw:1}],
      [{id:"russian_twist", n:"DB Russian Twist", s:2, r:"20"},
       {id:"dead_bug", n:"Dead Bug", s:2, r:"12", bw:1}]
    ]},
    legs: {focus:"Legs & Back", cue:"Hips and pulls. Brace the core on everything.", ex:[
      {id:"goblet_squat", n:"DB Goblet Squat", s:4, r:"10-12"},
      {id:"db_rdl", n:"DB Romanian Deadlift", s:4, r:"8-10"},
      {id:"bulgarian", n:"Bulgarian Split Squat", s:3, r:"10"},
      {id:"single_arm_row", n:"Single-arm DB Row", s:3, r:"10"},
      {id:"walking_lunge", n:"DB Walking Lunge", s:3, r:"12"},
      {id:"glute_bridge", n:"DB Glute Bridge", s:3, r:"15"},
      {id:"standing_calf", n:"Standing DB Calf Raise", s:4, r:"15-20"},
      {id:"hanging_leg_raise", n:"Hanging Leg Raise", s:3, r:"AMRAP", bw:1}
    ], core:[
      [{id:"woodchop", n:"Cable Woodchop", s:2, r:"12"},
       {id:"hollow_hold", n:"Hollow Body Hold", s:2, r:"30", unit:"sec", bw:1}],
      [{id:"reverse_crunch", n:"Reverse Crunch", s:2, r:"15", bw:1},
       {id:"shoulder_taps", n:"Plank Shoulder Taps", s:2, r:"20", bw:1}],
      [{id:"decline_situp", n:"Decline Sit-up w/ DB", s:2, r:"12"},
       {id:"flutter_kicks", n:"Flutter Kicks", s:2, r:"40", unit:"sec", bw:1}]
    ]},
    arms: {focus:"Shoulders & Arms", cue:"Strict form beats heavy here. Chase the pump.", ex:[
      {id:"seated_db_press", n:"Seated DB Shoulder Press", s:4, r:"8-10"},
      {id:"lateral_raise", n:"DB Lateral Raise", s:4, r:"12-15"},
      {id:"ez_curl", n:"EZ-Bar Curl", s:3, r:"10-12"},
      {id:"ez_skullcrusher", n:"EZ-Bar Skullcrusher", s:3, r:"10-12"},
      {id:"hammer_curl", n:"DB Hammer Curl", s:3, r:"12"},
      {id:"oh_tri_ext", n:"Overhead DB Tricep Extension", s:3, r:"12"},
      {id:"rear_delt_fly", n:"Rear-delt DB Flye", s:3, r:"15"},
      {id:"cable_curl", n:"Cable Rope Curl", s:3, r:"15"}
    ], core:[
      [{id:"hanging_leg_raise", n:"Hanging Leg Raise", s:2, r:"10", bw:1},
       {id:"pallof_press", n:"Pallof Press", s:2, r:"12"}],
      [{id:"v_up", n:"V-Ups", s:2, r:"12", bw:1},
       {id:"suitcase_carry", n:"Suitcase Carry", s:2, r:"40", unit:"sec"}],
      [{id:"ab_wheel", n:"Ab Wheel Rollout", s:2, r:"10", bw:1},
       {id:"bird_dog", n:"Bird Dog", s:2, r:"12", bw:1}]
    ]}
  },
  B: {
    chest: {focus:"Chest & Back", cue:"Incline lead. Different angle, same movements underneath.", ex:[
      {id:"incline_db_press", n:"Incline DB Press", s:4, r:"8-10"},
      {id:"chinup", n:"Chin-ups", s:4, r:"AMRAP", bw:1},
      {id:"squeeze_press", n:"DB Squeeze Press", s:3, r:"12"},
      {id:"single_arm_row", n:"Single-arm DB Row", s:4, r:"10"},
      {id:"cs_db_row", n:"Chest-Supported DB Row", s:3, r:"12"},
      {id:"cable_crossover", n:"Cable Crossover", s:3, r:"15"},
      {id:"db_pullover", n:"DB Pullover", s:3, r:"12"},
      {id:"feet_elev_pushup", n:"Feet-Elevated Push-ups", s:3, r:"AMRAP", bw:1}
    ], core:[
      [{id:"toes_to_bar", n:"Toes-to-Bar", s:2, r:"8", bw:1},
       {id:"copenhagen", n:"Copenhagen Plank", s:2, r:"20", unit:"sec", bw:1}],
      [{id:"cable_crunch", n:"Cable Crunch", s:2, r:"15"},
       {id:"mountain_climber", n:"Mountain Climbers", s:2, r:"40", unit:"sec", bw:1}],
      [{id:"db_side_bend", n:"DB Side Bend", s:2, r:"15"},
       {id:"hollow_rock", n:"Hollow Rock", s:2, r:"20", bw:1}]
    ]},
    legs: {focus:"Legs & Back", cue:"Unilateral bias. Weaker side sets the reps.", ex:[
      {id:"db_front_squat", n:"DB Front Squat", s:4, r:"8-10"},
      {id:"single_leg_rdl", n:"Single-leg DB RDL", s:3, r:"10"},
      {id:"db_step_up", n:"DB Step-up", s:3, r:"10"},
      {id:"seated_row", n:"Seated Cable Row", s:4, r:"10-12"},
      {id:"reverse_lunge", n:"DB Reverse Lunge", s:3, r:"12"},
      {id:"leg_curl", n:"Seated Leg Curl", s:3, r:"12"},
      {id:"seated_calf", n:"Seated Calf Raise w/ DB", s:4, r:"20"},
      {id:"db_good_morning", n:"DB Good Morning", s:3, r:"12"}
    ], core:[
      [{id:"decline_situp", n:"Decline Sit-up w/ DB", s:2, r:"12"},
       {id:"side_plank_reach", n:"Side Plank w/ Reach", s:2, r:"30", unit:"sec", bw:1}],
      [{id:"oblique_knee_raise", n:"Hanging Oblique Knee Raise", s:2, r:"10", bw:1},
       {id:"weighted_dead_bug", n:"Dead Bug w/ DB", s:2, r:"12"}],
      [{id:"plank_up_down", n:"Plank Up-Downs", s:2, r:"12", bw:1},
       {id:"flutter_kicks", n:"Flutter Kicks", s:2, r:"40", unit:"sec", bw:1}]
    ]},
    arms: {focus:"Shoulders & Arms", cue:"Standing press day. Glutes tight, ribs down.", ex:[
      {id:"standing_ohp", n:"Standing DB Overhead Press", s:4, r:"8-10"},
      {id:"arnold_press", n:"DB Arnold Press", s:3, r:"10-12"},
      {id:"lateral_raise", n:"DB Lateral Raise", s:4, r:"15"},
      {id:"face_pull", n:"Face Pull", s:3, r:"15"},
      {id:"incline_curl", n:"Incline DB Curl", s:3, r:"10-12"},
      {id:"close_grip_press", n:"EZ-Bar Close-Grip Press", s:3, r:"10"},
      {id:"concentration_curl", n:"DB Concentration Curl", s:3, r:"12"},
      {id:"bench_dip", n:"Bench Dips", s:3, r:"AMRAP", bw:1}
    ], core:[
      [{id:"ab_wheel", n:"Ab Wheel Rollout", s:2, r:"10", bw:1},
       {id:"pallof_press", n:"Pallof Press", s:2, r:"12"}],
      [{id:"v_up", n:"V-Ups", s:2, r:"15", bw:1},
       {id:"farmer_carry", n:"Farmer Carry", s:2, r:"45", unit:"sec"}],
      [{id:"reverse_crunch", n:"Reverse Crunch", s:2, r:"15", bw:1},
       {id:"plank", n:"Plank", s:2, r:"60", unit:"sec", bw:1}]
    ]}
  },
  C: {
    chest: {focus:"Chest & Back", cue:"Heavy week. Lower reps, longer rest, real weight.", ex:[
      {id:"flat_db_press", n:"Flat DB Bench Press", s:5, r:"5-6"},
      {id:"wide_pullup", n:"Wide-grip Pull-ups", s:4, r:"6-8", bw:1},
      {id:"incline_db_press", n:"Incline DB Press", s:3, r:"8-10"},
      {id:"incline_db_fly", n:"Incline DB Flye", s:3, r:"12"},
      {id:"renegade_row", n:"Renegade Row", s:3, r:"8"},
      {id:"db_pullover", n:"DB Pullover", s:3, r:"12"},
      {id:"db_shrug", n:"Heavy DB Shrug", s:3, r:"12-15"},
      {id:"diamond_pushup", n:"Diamond Push-ups", s:3, r:"AMRAP", bw:1}
    ], core:[
      [{id:"weighted_leg_raise", n:"Weighted Hanging Leg Raise", s:2, r:"10"},
       {id:"hollow_hold", n:"Hollow Body Hold", s:2, r:"40", unit:"sec", bw:1}],
      [{id:"woodchop", n:"Cable Woodchop", s:2, r:"12"},
       {id:"bicycle_crunch", n:"Bicycle Crunch", s:2, r:"24", bw:1}],
      [{id:"russian_twist", n:"DB Russian Twist", s:2, r:"24"},
       {id:"side_plank", n:"Side Plank", s:2, r:"40", unit:"sec", bw:1}]
    ]},
    legs: {focus:"Legs & Back", cue:"Heavy single-leg. This is the one that hurts tomorrow.", ex:[
      {id:"bulgarian", n:"Bulgarian Split Squat", s:4, r:"8"},
      {id:"stiff_leg_dl", n:"DB Stiff-leg Deadlift", s:4, r:"10"},
      {id:"sumo_squat", n:"DB Sumo Squat", s:3, r:"12"},
      {id:"hip_thrust", n:"DB Hip Thrust", s:4, r:"8-10"},
      {id:"inverted_row", n:"Inverted Row", s:3, r:"AMRAP", bw:1},
      {id:"lateral_lunge", n:"DB Lateral Lunge", s:3, r:"10"},
      {id:"single_leg_calf", n:"Single-leg Calf Raise", s:3, r:"15"},
      {id:"hanging_knee_twist", n:"Hanging Knee Raise w/ Twist", s:3, r:"12", bw:1}
    ], core:[
      [{id:"toes_to_bar", n:"Toes-to-Bar", s:2, r:"8", bw:1},
       {id:"pallof_press", n:"Pallof Press", s:2, r:"15"}],
      [{id:"decline_situp", n:"Decline Sit-up w/ DB", s:2, r:"10"},
       {id:"bird_dog", n:"Bird Dog", s:2, r:"12", bw:1}],
      [{id:"suitcase_carry", n:"Suitcase Carry", s:2, r:"45", unit:"sec"},
       {id:"dead_bug", n:"Dead Bug", s:2, r:"15", bw:1}]
    ]},
    arms: {focus:"Shoulders & Arms", cue:"Explosive press, then burn the arms out.", ex:[
      {id:"push_press", n:"DB Push Press", s:4, r:"6-8"},
      {id:"seated_lateral_raise", n:"Seated DB Lateral Raise", s:4, r:"15"},
      {id:"ez_upright_row", n:"EZ-Bar Upright Row", s:3, r:"12"},
      {id:"rear_delt_raise", n:"Bent-over Rear-delt Raise", s:3, r:"15"},
      {id:"ez_21s", n:"EZ-Bar 21s", s:3, r:"21"},
      {id:"ez_oh_ext", n:"Overhead EZ-Bar Extension", s:3, r:"12"},
      {id:"cross_hammer_curl", n:"Cross-body Hammer Curl", s:3, r:"12"},
      {id:"tri_kickback", n:"DB Tricep Kickback", s:3, r:"15"}
    ], core:[
      [{id:"ab_wheel", n:"Ab Wheel Rollout", s:2, r:"12", bw:1},
       {id:"copenhagen", n:"Copenhagen Plank", s:2, r:"25", unit:"sec", bw:1}],
      [{id:"cable_crunch", n:"Cable Crunch", s:2, r:"15"},
       {id:"mountain_climber", n:"Mountain Climbers", s:2, r:"45", unit:"sec", bw:1}],
      [{id:"v_up", n:"V-Ups", s:2, r:"15", bw:1},
       {id:"plank", n:"Plank", s:2, r:"60", unit:"sec", bw:1}]
    ]}
  }
};
