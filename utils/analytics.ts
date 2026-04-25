/**
 * Calculates the Body Mass Index (BMI) from weight and height.
 *
 * @param weight - The weight in kilograms.
 * @param heightCm - The height in centimeters.
 * @returns The BMI value.
 *
 * @example
 * calculateBMI(70, 175);
 * // Output: 22.857142857142858
 *
 * @usage
 * Used in:
 * - `ProfileScreen` (app/(app)/profile/index.tsx)
 */
export function calculateBMI(weightInput: unknown, heightCmInput: unknown): number | null {
  // Convert safely to number
  const weight = Number(weightInput)
  const heightCm = Number(heightCmInput)

  // Reject invalid numbers
  if (!Number.isFinite(weight) || !Number.isFinite(heightCm)) {
    return null
  }

  // Reject zero or negative values
  if (weight <= 0 || heightCm <= 0) {
    return null
  }

  // Reject unrealistic biological inputs
  // Weight: 20kg – 400kg
  // Height: 100cm – 250cm
  if (weight < 20 || weight > 400) {
    return null
  }

  if (heightCm < 100 || heightCm > 250) {
    return null
  }

  // Convert height to meters safely
  const heightM = heightCm / 100

  // Extra safety guard against division by zero
  if (heightM <= 0) {
    return null
  }

  const bmi = weight / (heightM * heightM)

  // Reject invalid results
  if (!Number.isFinite(bmi)) {
    return null
  }

  // Clamp to physiologically possible BMI range
  // Human BMI rarely below 10 or above 80
  const clampedBMI = Math.min(Math.max(bmi, 10), 80)

  return clampedBMI
}

/**
 * Calculates the body fat percentage from weight and height.
 *
 * @param gender - The gender of the person.
 * @param height - The height in centimeters.
 * @param neck - The neck circumference in centimeters.
 * @param waist - The waist circumference in centimeters.
 * @param hips - The hip circumference in centimeters (optional).
 * @returns The body fat percentage.
 *
 * @example
 * calculateBodyFat({ gender: 'male', height: 175, neck: 38, waist: 85 });
 * // Output: 15.234567890123456
 *
 * @usage
 * Used in:
 * - `ProfileScreen` (app/(app)/profile/index.tsx)
 */
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
  // Convert safely to numbers
  const height = Number(heightInput)
  const neck = Number(neckInput)
  const waist = Number(waistInput)
  const hips = hipsInput !== undefined ? Number(hipsInput) : undefined

  // Validate numeric inputs
  if (!Number.isFinite(height) || !Number.isFinite(neck) || !Number.isFinite(waist)) {
    return null
  }

  if (hipsInput !== undefined && !Number.isFinite(hips)) {
    return null
  }

  // Reject zero or negative values
  if (height <= 0 || neck <= 0 || waist <= 0) {
    return null
  }

  // Reject unrealistic biological inputs
  // Height: 100–250 cm
  // Circumference: 20–200 cm (reasonable human range)
  if (height < 100 || height > 250) return null
  if (neck < 20 || neck > 80) return null
  if (waist < 40 || waist > 200) return null
  if (hipsInput !== undefined && (hips! < 50 || hips! > 200)) return null

  // Male calculation
  if (gender === 'male') {
    const diff = waist - neck

    // log10 requires positive input
    if (diff <= 0) return null

    const logDiff = Math.log10(diff)
    const logHeight = Math.log10(height)

    if (!Number.isFinite(logDiff) || !Number.isFinite(logHeight)) {
      return null
    }

    const denominator = 1.0324 - 0.19077 * logDiff + 0.15456 * logHeight

    // Prevent division by zero or negative denominator
    if (!Number.isFinite(denominator) || denominator <= 0) {
      return null
    }

    const result = 495 / denominator - 450

    if (!Number.isFinite(result)) return null

    // Clamp to realistic male body fat %
    return Math.min(Math.max(result, 2), 70)
  }

  // Female calculation
  if (gender === 'female') {
    if (hips === undefined) return null

    const diff = waist + hips - neck

    if (diff <= 0) return null

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

    if (!Number.isFinite(result)) return null

    // Clamp to realistic female body fat %
    return Math.min(Math.max(result, 5), 70)
  }

  // Unsupported gender
  return null
}

/**

* Estimates body fat percentage using BMI, age, and gender.
* Uses the Deurenberg formula which is commonly used when
* waist/neck measurements are unavailable (e.g. onboarding).
*
* Formula:
* bodyFat = (1.20 × BMI) + (0.23 × age) − (10.8 × gender) − 5.4
*
* genderFactor:
* * male = 1
* * female = 0
*
* @param gender - The gender of the person.
* @param height - Height in centimeters.
* @param weight - Weight in kilograms.
* @param age - Age in years.
*
* @returns Estimated body fat percentage or null if inputs are invalid.
*
* @example
* estimateBodyFatFromBMI({
* gender: "male",
* height: 173,
* weight: 99,
* age: 22
* })
* // ≈ 29
*
* @usage
* Used when:
* * onboarding does not collect waist/neck measurements
* * quick body fat estimate is needed
    */
export function estimateBodyFatFromBMI({
  gender,
  height: heightInput,
  weight: weightInput,
  age: ageInput,
}: {
  gender: string
  height: unknown
  weight: unknown
  age: unknown
}): number | null {
  // Convert inputs safely
  const height = Number(heightInput)
  const weight = Number(weightInput)
  const age = Number(ageInput)

  // Validate numeric inputs
  if (!Number.isFinite(height) || !Number.isFinite(weight) || !Number.isFinite(age)) {
    return null
  }

  // Reject zero or negative values
  if (height <= 0 || weight <= 0 || age <= 0) {
    return null
  }

  // Reject unrealistic biological inputs
  // Height: 100–250 cm
  // Weight: 25–400 kg
  // Age: 10–120
  if (height < 100 || height > 250) return null
  if (weight < 25 || weight > 400) return null
  if (age < 10 || age > 120) return null

  // Normalize gender
  const genderLower = gender?.toLowerCase()

  let genderFactor: number

  if (genderLower === 'male') {
    genderFactor = 1
  } else if (genderLower === 'female') {
    genderFactor = 0
  } else {
    return null
  }

  // Convert height to meters
  const heightMeters = height / 100

  // Calculate BMI
  const bmi = weight / (heightMeters * heightMeters)

  if (!Number.isFinite(bmi) || bmi <= 0) {
    return null
  }

  // Deurenberg formula
  const bodyFat = 1.2 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4

  if (!Number.isFinite(bodyFat)) {
    return null
  }

  // Clamp to realistic body fat ranges
  if (genderLower === 'male') {
    return Math.min(Math.max(bodyFat, 2), 60)
  }

  return Math.min(Math.max(bodyFat, 5), 65)
}

/**
 * Calculates the body composition from weight and body fat.
 *
 * @param weight - The weight in kilograms.
 * @param bodyFat - The body fat percentage.
 * @returns The fat mass and lean mass.
 *
 * @example
 * calculateComposition({ weight: 70, bodyFat: 15 });
 * // Output: { fatMass: 10.5, leanMass: 59.5 }
 */
export function calculateComposition({
  weight: weightInput,
  bodyFat: bodyFatInput,
}: {
  weight: unknown
  bodyFat: unknown
}): { fatMass: number; leanMass: number } | null {
  // Convert safely
  const weight = Number(weightInput)
  const bodyFat = Number(bodyFatInput)

  // Validate numeric
  if (!Number.isFinite(weight) || !Number.isFinite(bodyFat)) {
    return null
  }

  // Reject zero or negative weight
  if (weight <= 0) return null

  // Reject unrealistic weight (20–400kg human bounds)
  if (weight < 20 || weight > 400) return null

  // Reject impossible body fat %
  if (bodyFat < 0 || bodyFat > 70) return null
  // >70% is biologically extreme; treat as invalid input

  // Calculate fat mass
  const fatMassRaw = weight * (bodyFat / 100)

  if (!Number.isFinite(fatMassRaw)) return null

  // Guard against floating overflow
  const fatMass = Math.min(Math.max(fatMassRaw, 0), weight)

  const leanMass = weight - fatMass

  if (!Number.isFinite(leanMass)) return null

  // Final safety clamp
  const safeLeanMass = Math.min(Math.max(leanMass, 0), weight)

  return {
    fatMass: Number(fatMass.toFixed(2)),
    leanMass: Number(safeLeanMass.toFixed(2)),
  }
}

/**
 * Type for body fat feedback.
 */
export type BodyFatFeedback = {
  category: string
  colorStart: string
  colorEnd: string
  insight: string
}

/**
 * Classifies body fat percentage into categories and provides feedback.
 *
 * @param gender - The gender of the person.
 * @param bodyFat - The body fat percentage.
 * @param goal - The user's goal (optional).
 * @returns An object containing the body fat category, color range, and insight.
 *
 * @example
 * classifyBodyFat({ gender: 'male', bodyFat: 15, goal: 'gainMuscle' });
 * // Output: { category: 'Athletic', colorStart: '#3b82f6', colorEnd: '#22c55e', insight: 'You are within a healthy performance range.' }
 */
export function classifyBodyFat({
  gender,
  bodyFat,
  goal,
}: {
  gender: 'male' | 'female'
  bodyFat: number
  goal?: string | null
}): BodyFatFeedback {
  const ranges =
    gender === 'male'
      ? [
          { max: 5, label: 'Essential' },
          { max: 13, label: 'Athletic' },
          { max: 17, label: 'Fit' },
          { max: 24, label: 'Average' },
          { max: Infinity, label: 'High' },
        ]
      : [
          { max: 13, label: 'Essential' },
          { max: 20, label: 'Athletic' },
          { max: 24, label: 'Fit' },
          { max: 31, label: 'Average' },
          { max: Infinity, label: 'High' },
        ]

  const category = ranges.find((r) => bodyFat <= r.max)?.label ?? 'Unknown'

  const gradientMap: Record<string, [string, string]> = {
    Essential: ['#6b7280', '#9ca3af'],
    Athletic: ['#3b82f6', '#22c55e'],
    Fit: ['#22c55e', '#16a34a'],
    Average: ['#f59e0b', '#f97316'],
    High: ['#f97316', '#ef4444'],
  }

  const [colorStart, colorEnd] = gradientMap[category] ?? ['#6b7280', '#9ca3af']

  let insight = ''

  if (goal === 'gainMuscle' && category === 'Essential') {
    insight = 'Very low body fat may limit optimal muscle gain.'
  } else if (goal === 'loseWeight' && category === 'High') {
    insight = 'Reducing body fat will improve metabolic health.'
  } else if (category === 'Athletic' || category === 'Fit') {
    insight = 'You are within a healthy performance range.'
  } else if (category === 'Average') {
    insight = 'You are within general population range.'
  } else if (category === 'High') {
    insight = 'Body fat is above recommended range.'
  } else {
    insight = 'Body composition is within essential range.'
  }

  return { category, colorStart, colorEnd, insight }
}

/**
 * Classifies BMI into categories.
 *
 * @param bmi - The BMI value.
 * @returns The BMI category.
 *
 * @example
 * classifyBMI(22.857142857142858);
 * // Output: 'Normal'
 */
export function classifyBMI(bmi: number) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

/**
 * Generates an insight based on body fat and BMI categories.
 *
 * @param bodyFatCategory - The body fat category.
 * @param bmiCategory - The BMI category.
 * @returns An insight message.
 *
 * @example
 * generateInsight({ bodyFatCategory: 'Athletic', bmiCategory: 'Normal' });
 * // Output: 'Strong metabolic health profile.'
 */
export function generateInsight({
  bodyFatCategory,
  bmiCategory,
}: {
  bodyFatCategory: string
  bmiCategory: string
}) {
  if (bodyFatCategory === 'Athletic') return 'Strong metabolic health profile.'
  if (bodyFatCategory === 'Fit') return 'Balanced composition and performance.'
  if (bodyFatCategory === 'High') return 'Reducing fat mass will improve health markers.'
  return 'Body composition within normal range.'
}

/**
 * Calculates a health score based on body fat and BMI categories.
 *
 * @param bodyFatCategory - The body fat category.
 * @param bmi - The BMI value.
 * @param goal - The user's goal (optional).
 * @returns The health score (0-100).
 *
 * @example
 * calculateHealthScore({ bodyFatCategory: 'Athletic', bmi: 22.857142857142858, goal: 'gainMuscle' });
 * // Output: 80
 */
export function calculateHealthScore({
  bodyFatCategory,
  bmi,
  goal,
}: {
  bodyFatCategory: string
  bmi: number
  goal?: string | null
}) {
  let score = 50

  if (bodyFatCategory === 'Athletic' || bodyFatCategory === 'Fit') score += 25
  if (bodyFatCategory === 'Average') score += 10
  if (bodyFatCategory === 'High') score -= 15

  if (bmi >= 18.5 && bmi < 25) score += 15
  if (bmi >= 25 && bmi < 30) score -= 5
  if (bmi >= 30) score -= 15

  if (goal === 'gainMuscle' && bodyFatCategory === 'Athletic') score += 5
  if (goal === 'loseWeight' && bodyFatCategory === 'High') score -= 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculates BMR using the Mifflin-St Jeor equation
 *
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
): number {
  // Base formula
  let bmr = 10 * weight + 6.25 * height - 5 * age

  if (gender === 'female') {
    bmr -= 161
  } else {
    // default male or other to male formula
    bmr += 5
  }

  return Math.round(bmr)
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on BMR and activity level
 *
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - The user's activity intensity
 */
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

/**
 * Calculates daily calorie and protein targets based on TDEE, goal, weight, and weekly rate
 */
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
  let proteinTarget = Math.round(weightKg * 1.8) // Default moderate protein

  if (goal === 'loseWeight' && weeklyRateKg) {
    // 1 kg fat ≈ 7700 kcal
    // daily deficit = (weeklyRate * 7700) / 7
    const dailyDeficit = Math.round((weeklyRateKg * 7700) / 7)
    caloriesTarget = tdee - dailyDeficit
    deficitOrSurplus = -dailyDeficit
    // protein target for fat loss: 2.0-2.2 g/kg
    proteinTarget = Math.round(weightKg * 2.1)
  } else if (goal === 'gainMuscle') {
    let surplus = 200 // Default to intermediate surplus
    if (fitnessLevel === 'beginner') surplus = 300
    else if (fitnessLevel === 'advanced') surplus = 100

    caloriesTarget = tdee + surplus
    deficitOrSurplus = surplus
    // protein target for muscle gain: 1.6-2.0 g/kg
    proteinTarget = Math.round(weightKg * 1.8)
  }

  // Floor calories to BMR or extreme lows (e.g. 1200 for females, 1500 for males usually)
  // We'll just enforce a basic minimum standard here to prevent dangerous targets
  const SAFE_MIN_CALORIES = 1200
  if (caloriesTarget < SAFE_MIN_CALORIES) {
    caloriesTarget = SAFE_MIN_CALORIES
  }

  // Calculate Fats and Carbs based on standard macros (25% Fats, remaining Carbs)
  // 1g Fat = 9 kcal
  // 1g Carb = 4 kcal
  // 1g Protein = 4 kcal
  const fatsTargetCalories = caloriesTarget * 0.25
  const fatsTarget = Math.round(fatsTargetCalories / 9)

  const proteinTargetCalories = proteinTarget * 4
  const remainingCaloriesForCarbs = caloriesTarget - fatsTargetCalories - proteinTargetCalories

  // Ensure carbs don't go negative on extreme cut logic, floor to 0
  const carbsTarget = Math.max(0, Math.round(remainingCaloriesForCarbs / 4))

  return {
    caloriesTarget,
    proteinTarget,
    fatsTarget,
    carbsTarget,
    deficitOrSurplus,
  }
}
