import { useMemo } from 'react'
import { Alert } from 'react-native'

import {
  useCreateMeasurementMutation,
  useDeleteMeasurementMutation,
  useUpdateMeasurementMutation,
} from '@/hooks/queries/use-user'
import { useUnitConverter } from '@/hooks/use-unit-converter'
import { Arise } from '@/lib/arise'
import { calculateBodyFat, calculateComposition } from '@/utils/analytics'

import type { MeasurementEntry, UserProfile } from '@/types/user'

export interface FormValues {
  weight: string
  neck: string
  waist: string
  hips: string
  shoulders: string
  chest: string
  abdomen: string
  leftBicep: string
  rightBicep: string
  leftForearm: string
  rightForearm: string
  leftThigh: string
  rightThigh: string
  leftCalf: string
  rightCalf: string
  notes: string
}

export const DEFAULT_VALUES: FormValues = {
  weight: '',
  neck: '',
  waist: '',
  hips: '',
  shoulders: '',
  chest: '',
  abdomen: '',
  leftBicep: '',
  rightBicep: '',
  leftForearm: '',
  rightForearm: '',
  leftThigh: '',
  rightThigh: '',
  leftCalf: '',
  rightCalf: '',
  notes: '',
}

export type FormatFn = (v: number) => number

export function parseVal(val: string, key: string, toWeight: FormatFn, toLength: FormatFn) {
  const parsed = Number.parseFloat(val)
  if (!val || Number.isNaN(parsed) || parsed <= 0)
    return null
  return key === 'weight' ? Number(toWeight(parsed).toFixed(2)) : Number(toLength(parsed).toFixed(2))
}

function formatField(field: keyof FormValues, val: string | number | null | undefined, formatWeight: FormatFn, formatLength: FormatFn) {
  if (val === null || val === undefined)
    return ''
  const num = typeof val === 'string' ? Number.parseFloat(val) : val
  if (Number.isNaN(num))
    return ''
  return (field === 'weight' ? formatWeight(num) : formatLength(num)).toString()
}

export function useDefaultValues(measurement: MeasurementEntry | undefined) {
  const { formatWeight, formatLength } = useUnitConverter()
  return useMemo(() => {
    if (!measurement)
      return DEFAULT_VALUES
    const values = {} as FormValues
    Object.keys(DEFAULT_VALUES).forEach((k) => {
      const f = k as keyof FormValues
      values[f] = f === 'notes' ? (measurement.notes || '') : formatField(f, measurement[f], formatWeight, formatLength)
    })
    return values
  }, [measurement, formatWeight, formatLength])
}

function getBodyFat(user: UserProfile, vals: { n: number, w: number, h: number }, toLen: FormatFn) {
  return calculateBodyFat({
    gender: user.gender ?? 'other',
    height: user.height ?? undefined,
    neck: toLen(vals.n),
    waist: toLen(vals.w),
    hips: Number.isNaN(vals.h) ? undefined : toLen(vals.h),
  })
}

function getLeanMass(weight: number, bf: number, toWt: FormatFn, unit: string) {
  const comp = calculateComposition({ weight: toWt(weight), bodyFat: bf })
  if (!comp)
    return '--'
  const val = unit === 'kg' ? comp.leanMass : comp.leanMass * 2.20462
  return `${val.toFixed(1)} ${unit}`
}

interface CalcParams {
  user: UserProfile | undefined
  neck: string
  waist: string
  hips: string
  weight: string
  toLen: FormatFn
  toWt: FormatFn
  unit: string
}

export function calculateEst(p: CalcParams) {
  const n = Number.parseFloat(p.neck)
  const w = Number.parseFloat(p.waist)
  const h = Number.parseFloat(p.hips)
  const wt = Number.parseFloat(p.weight)
  if (!p.user || Number.isNaN(n) || Number.isNaN(w) || Number.isNaN(wt)) {
    return { bodyFatDisplay: '--', leanMassDisplay: '--' }
  }
  const bf = getBodyFat(p.user, { n, w, h }, p.toLen)
  if (bf === null)
    return { bodyFatDisplay: '--', leanMassDisplay: '--' }
  return {
    bodyFatDisplay: `${bf.toFixed(1)}%`,
    leanMassDisplay: getLeanMass(wt, bf, p.toWt, p.unit),
  }
}

interface MutationOptions {
  onSuccess?: () => void
  onError?: (err: Error) => void
}

interface SaveMutations {
  update: { mutate: (variables: { id: string, data: Record<string, number | string> }, options?: MutationOptions) => void }
  create: { mutate: (variables: Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>, options?: MutationOptions) => void }
  dismiss: () => void
  reset: (v: FormValues) => void
}

function executeSave(payload: Record<string, number | string>, id: string | undefined, mut: SaveMutations) {
  if (id) {
    mut.update.mutate({ id, data: payload }, {
      onSuccess: () => {
        Arise.success('Measurements updated successfully!')
        mut.dismiss()
      },
      onError: (err: Error) => Arise.error(err.message || 'Failed to update measurements.'),
    })
  }
  else {
    mut.create.mutate(payload as unknown as Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>, {
      onSuccess: () => {
        Arise.success('Measurements saved successfully!')
        mut.reset(DEFAULT_VALUES)
        mut.dismiss()
      },
      onError: (err: Error) => Arise.error(err.message || 'Failed to save measurements.'),
    })
  }
}

function buildPayload(data: FormValues, toCanonicalWeight: FormatFn, toCanonicalLength: FormatFn, bodyFatDisplay: string) {
  const payload: Record<string, number | string> = { date: new Date().toISOString() }
  let hasAnyValue = false
  if (data.notes?.trim()) {
    payload.notes = data.notes
    hasAnyValue = true
  }
  Object.entries(data).forEach(([key, val]) => {
    if (key === 'notes')
      return
    const canonicalVal = parseVal(val, key, toCanonicalWeight, toCanonicalLength)
    if (canonicalVal !== null) {
      payload[key] = canonicalVal
      hasAnyValue = true
    }
  })
  if (bodyFatDisplay !== '--')
    payload.bodyFat = Number.parseFloat(bodyFatDisplay)
  return { payload, hasAnyValue }
}

export function useFormHandlers(
  measurement: MeasurementEntry | undefined,
  dismiss: () => void,
  bodyFatDisplay: string,
  reset: (values: FormValues) => void,
) {
  const { toCanonicalWeight, toCanonicalLength } = useUnitConverter()
  const createMeasurement = useCreateMeasurementMutation()
  const updateMeasurement = useUpdateMeasurementMutation()
  const deleteMeasurement = useDeleteMeasurementMutation()

  const onSubmit = (data: FormValues) => {
    const { payload, hasAnyValue } = buildPayload(data, toCanonicalWeight, toCanonicalLength, bodyFatDisplay)
    if (!hasAnyValue) {
      Arise.error('Please enter at least one measurement.')
      return
    }
    executeSave(payload, measurement?.id, { update: updateMeasurement, create: createMeasurement, dismiss, reset })
  }

  const handleDelete = () => {
    if (!measurement)
      return
    Alert.alert('Delete Entry', 'Are you sure you want to permanently delete this measurement entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMeasurement.mutate(measurement.id, {
            onSuccess: () => {
              Arise.success('Entry deleted successfully!')
              dismiss()
            },
            onError: err => Arise.error(err.message || 'Failed to delete entry.'),
          })
        },
      },
    ])
  }

  return {
    onSubmit,
    handleDelete,
    isPending: createMeasurement.isPending || updateMeasurement.isPending,
    isDeletePending: deleteMeasurement.isPending,
  }
}
