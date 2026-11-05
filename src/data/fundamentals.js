// My curated exercise list. `id` names the thumbnail in public/exercises (see
// scripts/make-exercise-icons.mjs); `name` is the display name.
export const GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

export const FUNDAMENTALS = [
  // Chest
  { id: 'Incline_Dumbbell_Press', name: 'Incline Dumbbell Press', group: 'Chest' },
  { id: 'Butterfly', name: 'Chest Fly Machine', group: 'Chest' },
  { id: 'Leverage_Chest_Press', name: 'Flat Chest Press Machine', group: 'Chest' },

  // Back
  { id: 'Wide-Grip_Lat_Pulldown', name: 'Lat Pulldown Machine', group: 'Back' },
  { id: 'Dumbbell_Incline_Row', name: 'Chest Supported Row', group: 'Back' },

  // Shoulders
  { id: 'Dumbbell_Shoulder_Press', name: 'Dumbbell Shoulder Press', group: 'Shoulders' },
  { id: 'Cable_Seated_Lateral_Raise', name: 'Cable Lateral Raise', group: 'Shoulders' },
  { id: 'Cable_Rear_Delt_Fly', name: 'Cable Rear Delt Fly', group: 'Shoulders' },

  // Arms
  { id: 'Seated_Dumbbell_Curl', name: 'Seated Dumbbell Curl', group: 'Arms' },
  { id: 'Machine_Preacher_Curls', name: 'Preacher Curl Machine', group: 'Arms' },
  { id: 'Triceps_Pushdown', name: 'Cable Tricep Pushdown', group: 'Arms' },
  { id: 'Triceps_Overhead_Extension_with_Rope', name: 'Overhead Cable Tricep Extension', group: 'Arms' },

  // Legs
  { id: 'Leg_Press', name: 'Leg Press Machine', group: 'Legs' },
  { id: 'Leg_Extensions', name: 'Leg Extension Machine', group: 'Legs' },
  { id: 'Seated_Leg_Curl', name: 'Hamstring Curl Machine', group: 'Legs' },
  { id: 'Standing_Calf_Raises', name: 'Standing Calf Raise Machine', group: 'Legs' },

  // Core
  { id: 'Cable_Crunch', name: 'Cable Ab Crunch', group: 'Core' },
  { id: 'Hanging_Leg_Raise', name: 'Leg Raise', group: 'Core' },
];
