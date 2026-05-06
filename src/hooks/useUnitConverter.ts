import { useCallback } from 'react'
import { LengthUnits, WeightUnits } from '@/types/me'
import { useProfileQuery } from './queries/me'

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
   Backend always stores in kg.
   • to display: convert from kg → user unit
   • to save:    convert from user unit → kg
--------------------------------------------- */

export function convertWeight(
  value: number,
  options?: {
    from?: WeightUnits
    to?: WeightUnits
    precision?: number
  },
) {
  // Guard against invalid input
  if (!Number.isFinite(value)) return 0

  const from = options?.from ?? 'kg'
  const to = options?.to ?? 'kg'
  const precision = options?.precision ?? 2

  if (from === to) return round(value, precision)

  // lbs → kg
  if (from === 'lbs' && to === 'kg') return round(value * LB_TO_KG, precision)
  // kg → lbs
  if (from === 'kg' && to === 'lbs') return round(value / LB_TO_KG, precision)

  return round(value, precision)
}

/* ---------------------------------------------
   Length Conversion
   Backend always stores in cm.
   • to display: convert from cm → user unit
   • to save:    convert from user unit → cm
--------------------------------------------- */

export function convertLength(
  value: number,
  options?: {
    from?: LengthUnits
    to?: LengthUnits
    precision?: number
  },
) {
  // Guard against invalid input
  if (!Number.isFinite(value)) return 0

  const from = options?.from ?? 'cm'
  const to = options?.to ?? 'cm'
  const precision = options?.precision ?? 2

  if (from === to) return round(value, precision)

  // inches → cm
  if (from === 'inches' && to === 'cm') return round(value * INCH_TO_CM, precision)
  // cm → inches
  if (from === 'cm' && to === 'inches') return round(value / INCH_TO_CM, precision)

  return round(value, precision)
}

/* ---------------------------------------------
   Display Helpers
   Convert a backend-stored value to the user's
   preferred unit for display.
   Input: always the backend canonical unit (kg / cm)
--------------------------------------------- */

/**
 * Convert a weight stored in kg to the user's preferred weight unit.
 * @param value - Weight in kg (as stored in the backend)
 */
export function displayWeight(value: number, unit: WeightUnits, options?: { precision?: number }) {
  return convertWeight(value, { from: 'kg', to: unit, precision: options?.precision ?? 2 })
}

/**
 * Convert a length stored in cm to the user's preferred length unit.
 * @param value - Length in cm (as stored in the backend)
 */
export function displayLength(value: number, unit: LengthUnits, options?: { precision?: number }) {
  return convertLength(value, { from: 'cm', to: unit, precision: options?.precision ?? 2 })
}

/* ---------------------------------------------
   The Hook
--------------------------------------------- */

/**
 * A hook that provides unit conversion functions based on the user's preferred units.
 * It internally manages fetching the user's preferences.
 */
export function useUnitConverter() {
  const { data: user } = useProfileQuery()

  const weightUnit: WeightUnits = (user as any)?.preferredWeightUnit ?? 'kg'
  const lengthUnit: LengthUnits = (user as any)?.preferredLengthUnit ?? 'cm'

  const formatWeight = useCallback(
    (kgValue: number, precision?: number) => {
      return displayWeight(kgValue, weightUnit, { precision })
    },
    [weightUnit],
  )

  const formatLength = useCallback(
    (cmValue: number, precision?: number) => {
      return displayLength(cmValue, lengthUnit, { precision })
    },
    [lengthUnit],
  )

  const toCanonicalWeight = useCallback(
    (value: number, precision?: number) => {
      return convertWeight(value, { from: weightUnit, to: 'kg', precision })
    },
    [weightUnit],
  )

  const toCanonicalLength = useCallback(
    (value: number, precision?: number) => {
      return convertLength(value, { from: lengthUnit, to: 'cm', precision })
    },
    [lengthUnit],
  )

  return {
    formatWeight,
    formatLength,
    toCanonicalWeight,
    toCanonicalLength,
    weightUnit,
    lengthUnit,
  }
}
