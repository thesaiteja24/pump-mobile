import { useCallback } from 'react'

import { useProfileQuery } from '@/hooks/queries/use-user'

import type { LengthUnits, WeightUnits } from '@/types/user'

const LB_TO_KG = 0.45359237
const INCH_TO_CM = 2.54

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function convertWeight(
  value: number,
  options?: {
    from?: WeightUnits
    to?: WeightUnits
    precision?: number
  },
) {
  if (!Number.isFinite(value))
    return 0

  const from = options?.from ?? 'kg'
  const to = options?.to ?? 'kg'
  const precision = options?.precision ?? 2

  if (from === to)
    return round(value, precision)

  return round(from === 'lbs' ? value * LB_TO_KG : value / LB_TO_KG, precision)
}

export function convertLength(
  value: number,
  options?: {
    from?: LengthUnits
    to?: LengthUnits
    precision?: number
  },
) {
  if (!Number.isFinite(value))
    return 0

  const from = options?.from ?? 'cm'
  const to = options?.to ?? 'cm'
  const precision = options?.precision ?? 2

  if (from === to)
    return round(value, precision)

  return round(from === 'inches' ? value * INCH_TO_CM : value / INCH_TO_CM, precision)
}

export function displayWeight(value: number, unit: WeightUnits, options?: { precision?: number }) {
  return convertWeight(value, { from: 'kg', to: unit, precision: options?.precision ?? 2 })
}

export function displayLength(value: number, unit: LengthUnits, options?: { precision?: number }) {
  return convertLength(value, { from: 'cm', to: unit, precision: options?.precision ?? 2 })
}

export function useUnitConverter() {
  const { data: user } = useProfileQuery()

  const weightUnit: WeightUnits = user?.preferredWeightUnit ?? 'kg'
  const lengthUnit: LengthUnits = user?.preferredLengthUnit ?? 'cm'

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
