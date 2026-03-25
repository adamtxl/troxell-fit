export type UserId = 'adam' | 'tammy'

export interface DayLog {
  date: string
  weight: number | null
  body_fat: number | null
  calories: number
  protein: number
  water: number
  sodium: number
  potassium: number
  magnesium: number
  creatine: boolean
  zepbound: boolean
}

export interface ExerciseSet {
  reps: string
  weight: string
}

export interface Exercise {
  name: string
  sets: ExerciseSet[]
}

export interface WorkoutLog {
  date: string
  type: string
  phase: string
  exercises: Exercise[]
}

export interface UserProfile {
  id: UserId
  name: string
  startWeight: number
  goalWeight: number
  startBF: number | null
  proteinMin: number
  proteinGoal: number
  calGoal: number
  waterGoal: number
  color: string
  accentColor: string
  supplements: { key: string; label: string; dose: string; color: string }[]
  workouts: boolean
}
