function calculateMaleBodyFat(height: number, neck: number, waist: number): number | null {
  const diff = waist - neck
  if (diff <= 0)
    return null

  const logDiff = Math.log10(diff)
  const logHeight = Math.log10(height)

  if (!Number.isFinite(logDiff) || !Number.isFinite(logHeight)) {
    return null
  }

  const denominator = 1.0324 - 0.19077 * logDiff + 0.15456 * logHeight
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return null
  }

  const result = 495 / denominator - 450
  if (!Number.isFinite(result))
    return null

  return Math.min(Math.max(result, 2), 70)
}

function calculateFemaleBodyFat(height: number, neck: number, waist: number, hips: number): number | null {
  const diff = waist + hips - neck
  if (diff <= 0)
    return null

  const logDiff = Math.log10(diff)
  const logHeight = Math.log10(height)

  if (!Number.isFinite(logDiff) || !Number.isFinite(logHeight)) {
    return null
  }

  const denominator = 1.29579 - 0.35004 * logDiff + 0.221 * logHeight
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return null
  }

  const result = 495 / denominator - 450
  if (!Number.isFinite(result))
    return null

  return Math.min(Math.max(result, 5), 70)
}

function isOutOfRange(h: number, n: number, w: number): boolean {
  if (h < 100 || h > 250)
    return true
  if (n < 20 || n > 80)
    return true
  if (w < 40 || w > 200)
    return true
  return false
}

function hasInvalidNumbers(height: number, neck: number, waist: number): boolean {
  if (!Number.isFinite(height) || height <= 0)
    return true
  if (!Number.isFinite(neck) || neck <= 0)
    return true
  if (!Number.isFinite(waist) || waist <= 0)
    return true
  return false
}

function isInvalidInput(height: number, neck: number, waist: number, hips?: number): boolean {
  if (hasInvalidNumbers(height, neck, waist))
    return true

  if (isOutOfRange(height, neck, waist))
    return true

  if (hips !== undefined) {
    if (!Number.isFinite(hips) || hips < 50 || hips > 200)
      return true
  }

  return false
}

export function calculateBodyFat({
  gender,
  height: heightInput,
  neck: neckInput,
  waist: waistInput,
  hips: hipsInput,
}: {
  gender: string
  height: unknown
  neck: unknown
  waist: unknown
  hips?: unknown
}): number | null {
  const height = Number(heightInput)
  const neck = Number(neckInput)
  const waist = Number(waistInput)
  const hips = hipsInput !== undefined ? Number(hipsInput) : undefined

  if (isInvalidInput(height, neck, waist, hips)) {
    return null
  }

  if (gender === 'male') {
    return calculateMaleBodyFat(height, neck, waist)
  }

  if (gender === 'female' && hips !== undefined) {
    return calculateFemaleBodyFat(height, neck, waist, hips)
  }

  return null
}

export function calculateComposition({
  weight: weightInput,
  bodyFat: bodyFatInput,
}: {
  weight: unknown
  bodyFat: unknown
}): { fatMass: number, leanMass: number } | null {
  const weight = Number(weightInput)
  const bodyFat = Number(bodyFatInput)

  if (!Number.isFinite(weight) || !Number.isFinite(bodyFat)) {
    return null
  }

  if (weight <= 0 || weight < 20 || weight > 400 || bodyFat < 0 || bodyFat > 70)
    return null

  const fatMassRaw = weight * (bodyFat / 100)
  if (!Number.isFinite(fatMassRaw))
    return null

  const fatMass = Math.min(Math.max(fatMassRaw, 0), weight)
  const leanMass = weight - fatMass

  if (!Number.isFinite(leanMass))
    return null

  const safeLeanMass = Math.min(Math.max(leanMass, 0), weight)

  return {
    fatMass: Number(fatMass.toFixed(2)),
    leanMass: Number(safeLeanMass.toFixed(2)),
  }
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
): number {
  let bmr = 10 * weight + 6.25 * height - 5 * age

  if (gender === 'female') {
    bmr -= 161
  }
  else {
    bmr += 5
  }

  return Math.round(bmr)
}

export function calculateTDEE(
  bmr: number,
  activityLevel: 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'athlete',
): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    lightlyActive: 1.375,
    moderatelyActive: 1.55,
    veryActive: 1.725,
    athlete: 1.9,
  }

  const multiplier = multipliers[activityLevel] || 1.2
  return Math.round(bmr * multiplier)
}

export function calculateDailyTargets({
  tdee,
  weightKg,
  goal,
  fitnessLevel,
  weeklyRateKg,
}: {
  tdee: number
  weightKg: number
  goal:
    | 'loseWeight'
    | 'gainMuscle'
    | 'improveEndurance'
    | 'improveFlexibility'
    | 'improveStrength'
    | 'improveOverallFitness'
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced' | null
  weeklyRateKg?: number | null
}) {
  let caloriesTarget = tdee
  let deficitOrSurplus = 0
  let proteinTarget = Math.round(weightKg * 1.8)

  if (goal === 'loseWeight' && weeklyRateKg) {
    const dailyDeficit = Math.round((weeklyRateKg * 7700) / 7)
    caloriesTarget = tdee - dailyDeficit
    deficitOrSurplus = -dailyDeficit
    proteinTarget = Math.round(weightKg * 2.1)
  }
  else if (goal === 'gainMuscle') {
    let surplus = 200
    if (fitnessLevel === 'beginner')
      surplus = 300
    else if (fitnessLevel === 'advanced')
      surplus = 100

    caloriesTarget = tdee + surplus
    deficitOrSurplus = surplus
    proteinTarget = Math.round(weightKg * 1.8)
  }

  const SAFE_MIN_CALORIES = 1200
  if (caloriesTarget < SAFE_MIN_CALORIES) {
    caloriesTarget = SAFE_MIN_CALORIES
  }

  const fatsTargetCalories = caloriesTarget * 0.25
  const fatsTarget = Math.round(fatsTargetCalories / 9)

  const proteinTargetCalories = proteinTarget * 4
  const remainingCaloriesForCarbs = caloriesTarget - fatsTargetCalories - proteinTargetCalories

  const carbsTarget = Math.max(0, Math.round(remainingCaloriesForCarbs / 4))

  return {
    caloriesTarget,
    proteinTarget,
    fatsTarget,
    carbsTarget,
    deficitOrSurplus,
  }
}
