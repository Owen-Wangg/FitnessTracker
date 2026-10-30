// The fundamental lifts. `id` matches a folder of photos in the public-domain
// Free Exercise DB (https://github.com/yuhonas/free-exercise-db); `name` is the display name.
export const GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

export const FUNDAMENTALS = [
  // Chest
  { id: 'Barbell_Bench_Press_-_Medium_Grip', name: 'Bench Press', group: 'Chest' },
  { id: 'Barbell_Incline_Bench_Press_-_Medium_Grip', name: 'Incline Bench Press', group: 'Chest' },
  { id: 'Dumbbell_Bench_Press', name: 'Dumbbell Bench Press', group: 'Chest' },
  { id: 'Incline_Dumbbell_Press', name: 'Incline Dumbbell Press', group: 'Chest' },
  { id: 'Dumbbell_Flyes', name: 'Dumbbell Fly', group: 'Chest' },
  { id: 'Pushups', name: 'Push-Up', group: 'Chest' },
  { id: 'Dips_-_Chest_Version', name: 'Chest Dip', group: 'Chest' },

  // Back
  { id: 'Barbell_Deadlift', name: 'Deadlift', group: 'Back' },
  { id: 'Bent_Over_Barbell_Row', name: 'Barbell Row', group: 'Back' },
  { id: 'One-Arm_Dumbbell_Row', name: 'Dumbbell Row', group: 'Back' },
  { id: 'Pullups', name: 'Pull-Up', group: 'Back' },
  { id: 'Chin-Up', name: 'Chin-Up', group: 'Back' },
  { id: 'Wide-Grip_Lat_Pulldown', name: 'Lat Pulldown', group: 'Back' },
  { id: 'Seated_Cable_Rows', name: 'Seated Cable Row', group: 'Back' },
  { id: 'Barbell_Shrug', name: 'Barbell Shrug', group: 'Back' },

  // Shoulders
  { id: 'Barbell_Shoulder_Press', name: 'Overhead Press', group: 'Shoulders' },
  { id: 'Dumbbell_Shoulder_Press', name: 'Dumbbell Shoulder Press', group: 'Shoulders' },
  { id: 'Side_Lateral_Raise', name: 'Lateral Raise', group: 'Shoulders' },
  { id: 'Reverse_Flyes', name: 'Rear Delt Fly', group: 'Shoulders' },
  { id: 'Face_Pull', name: 'Face Pull', group: 'Shoulders' },

  // Arms
  { id: 'Barbell_Curl', name: 'Barbell Curl', group: 'Arms' },
  { id: 'Dumbbell_Bicep_Curl', name: 'Dumbbell Curl', group: 'Arms' },
  { id: 'Hammer_Curls', name: 'Hammer Curl', group: 'Arms' },
  { id: 'Triceps_Pushdown', name: 'Triceps Pushdown', group: 'Arms' },
  { id: 'Close-Grip_Barbell_Bench_Press', name: 'Close-Grip Bench Press', group: 'Arms' },
  { id: 'Dips_-_Triceps_Version', name: 'Triceps Dip', group: 'Arms' },
  { id: 'Lying_Triceps_Press', name: 'Skull Crusher', group: 'Arms' },

  // Legs
  { id: 'Barbell_Squat', name: 'Squat', group: 'Legs' },
  { id: 'Front_Squat_Clean_Grip', name: 'Front Squat', group: 'Legs' },
  { id: 'Goblet_Squat', name: 'Goblet Squat', group: 'Legs' },
  { id: 'Leg_Press', name: 'Leg Press', group: 'Legs' },
  { id: 'Romanian_Deadlift', name: 'Romanian Deadlift', group: 'Legs' },
  { id: 'Dumbbell_Lunges', name: 'Lunge', group: 'Legs' },
  { id: 'Leg_Extensions', name: 'Leg Extension', group: 'Legs' },
  { id: 'Lying_Leg_Curls', name: 'Leg Curl', group: 'Legs' },
  { id: 'Barbell_Hip_Thrust', name: 'Hip Thrust', group: 'Legs' },
  { id: 'Standing_Calf_Raises', name: 'Calf Raise', group: 'Legs' },

  // Core
  { id: 'Crunches', name: 'Crunch', group: 'Core' },
  { id: 'Plank', name: 'Plank', group: 'Core' },
  { id: 'Hanging_Leg_Raise', name: 'Hanging Leg Raise', group: 'Core' },
];
