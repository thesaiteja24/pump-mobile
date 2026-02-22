import { useAuth } from '@/stores/authStore'
import { LengthUnits, WeightUnits } from '@/stores/userStore'

/* ---------------------------------------------
   Constants (never magic numbers)
--------------------------------------------- */
const LB_TO_KG = 0.45359237
const INCH_TO_CM = 2.54

/* ---------------------------------------------
   Helpers
--------------------------------------------- */
function round(value: number, decimals = 2) {
	const factor = Math.pow(10, decimals)
	return Math.round(value * factor) / factor
}

/* ---------------------------------------------
   Weight Conversion
--------------------------------------------- */

export function convertWeight(
	value: number,
	options?: {
		from?: WeightUnits
		to?: WeightUnits
		precision?: number
	}
) {
	const userUnit = useAuth.getState().user?.preferredWeightUnit ?? 'kg'

	const from = options?.from ?? 'kg'
	const to = options?.to ?? userUnit
	const precision = options?.precision ?? 2

	if (from === to) return round(value, precision)

	let result = from === 'lbs' ? value * LB_TO_KG : value / LB_TO_KG

	return round(result, precision)
}

/* ---------------------------------------------
   Length Conversion
--------------------------------------------- */

export function convertLength(
	value: number,
	options?: {
		from?: LengthUnits
		to?: LengthUnits
		precision?: number
	}
) {
	const userUnit = useAuth.getState().user?.preferredLengthUnit ?? 'cm'

	const from = options?.from ?? 'cm'
	const to = options?.to ?? userUnit
	const precision = options?.precision ?? 2

	if (from === to) return round(value, precision)

	let result = from === 'inches' ? value * INCH_TO_CM : value / INCH_TO_CM

	return round(result, precision)
}
