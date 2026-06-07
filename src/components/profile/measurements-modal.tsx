import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { LucideTrash, LucideX } from 'lucide-react-native'
import React, { forwardRef, memo, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { useProfileQuery } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { useUnitConverter } from '@/hooks/use-unit-converter'

import { calculateEst, useDefaultValues, useFormHandlers } from './measurements-helpers'

import type { FormValues } from './measurements-helpers'
import type { MeasurementEntry } from '@/types/user'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'
import type { Control } from 'react-hook-form'

const MeasurementInput = memo(({ label, name, control }: { label: string, name: keyof FormValues, control: Control<FormValues> }) => {
  const { colors, spacing, typography, layout } = useTheme()
  return (
    <Controller
      control={control}
      name={name}
      rules={{ validate: val => !val || (!Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0) || 'Invalid Number' }}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md }}>
          <View style={[layout.rowAlign, layout.rowBetween]}>
            <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
            <BottomSheetTextInput onBlur={onBlur} onChangeText={onChange} value={value} placeholder="--" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={[typography.bodyLg, { color: colors.text, textAlign: 'right', minWidth: 80 }]} />
          </View>
          {error && <Text style={[typography.caption, { color: colors.danger, textAlign: 'right', marginTop: spacing.xxs }]}>{error.message}</Text>}
        </View>
      )}
    />
  )
})
MeasurementInput.displayName = 'MeasurementInput'

function useCompositionCalc(neck: string, waist: string, hips: string, weight: string) {
  const { toCanonicalWeight, toCanonicalLength, weightUnit } = useUnitConverter()
  const { data: user } = useProfileQuery()
  return useMemo(() => {
    const p = { user, neck, waist, hips, weight, toLen: toCanonicalLength, toWt: toCanonicalWeight, unit: weightUnit }
    return calculateEst(p)
  }, [user, neck, waist, hips, weight, toCanonicalLength, toCanonicalWeight, weightUnit])
}

function useMeasurementsFormState(
  measurement: MeasurementEntry | undefined,
  dismiss: () => void,
) {
  const defaultValues = useDefaultValues(measurement)
  const { control, handleSubmit, watch, reset, formState: { isValid, isDirty } } = useForm<FormValues>({ defaultValues, mode: 'onChange' })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const { bodyFatDisplay, leanMassDisplay } = useCompositionCalc(watch('neck'), watch('waist'), watch('hips'), watch('weight'))
  const handlers = useFormHandlers(measurement, dismiss, bodyFatDisplay, reset)

  return {
    control,
    handleSubmit,
    isValid,
    isDirty,
    bodyFatDisplay,
    leanMassDisplay,
    reset,
    ...handlers,
  }
}

// eslint-disable-next-line react/no-forward-ref
export const MeasurementsModal = memo(forwardRef<BottomSheetMethods, { measurement?: MeasurementEntry }>((
  { measurement },
  ref,
) => {
  const { colors, spacing, layout, radius, typography } = useTheme()
  const { weightUnit, lengthUnit } = useUnitConverter()

  const dismiss = () => (ref as React.RefObject<BottomSheetMethods>).current?.dismiss()
  const state = useMeasurementsFormState(measurement, dismiss)

  const sections = useMemo(() => [
    { title: 'General', fields: [{ key: 'weight' as const, label: `Weight (${weightUnit})` }, { key: 'neck' as const, label: `Neck (${lengthUnit})` }, { key: 'waist' as const, label: `Waist (${lengthUnit})` }, { key: 'hips' as const, label: `Hips (${lengthUnit})` }] },
    { title: `Torso (${lengthUnit})`, fields: [{ key: 'shoulders' as const, label: 'Shoulders' }, { key: 'chest' as const, label: 'Chest' }, { key: 'abdomen' as const, label: 'Abdomen' }] },
    { title: `Arms (${lengthUnit})`, fields: [{ key: 'leftBicep' as const, label: 'Left Bicep' }, { key: 'rightBicep' as const, label: 'Right Bicep' }, { key: 'leftForearm' as const, label: 'Left Forearm' }, { key: 'rightForearm' as const, label: 'Right Forearm' }] },
    { title: `Legs (${lengthUnit})`, fields: [{ key: 'leftThigh' as const, label: 'Left Thigh' }, { key: 'rightThigh' as const, label: 'Right Thigh' }, { key: 'leftCalf' as const, label: 'Left Calf' }, { key: 'rightCalf' as const, label: 'Right Calf' }] },
  ], [weightUnit, lengthUnit])

  return (
    <BottomSheetModal ref={ref} enableDynamicSizing enablePanDownToClose={false} backgroundStyle={{ backgroundColor: colors.card }}>
      <BottomSheetView style={{ padding: spacing.lg }}>
        <BottomSheetScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <Text style={[typography.bodySmStrong, { color: colors.text, marginBottom: spacing.sm }]}>Notes</Text>
          <Controller
            control={state.control}
            name="notes"
            defaultValue=""
            render={({ field: { onChange, onBlur, value } }) => (
              <BottomSheetTextInput onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Any reflections on today's progress?" placeholderTextColor={colors.textMuted} multiline numberOfLines={3} style={[typography.body, { backgroundColor: colors.input, color: colors.text, padding: spacing.md, borderRadius: radius.md, textAlignVertical: 'top', minHeight: 85, marginBottom: spacing.lg }]} />
            )}
          />
          {sections.map(section => (
            <View key={section.title} style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.caption, { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold', marginBottom: spacing.sm }]}>{section.title}</Text>
              <View>
                {section.fields.map(field => <MeasurementInput key={field.key} label={field.label} name={field.key} control={state.control} />)}
                {section.title === 'General' && (
                  <>
                    <View style={[layout.rowAlign, layout.rowBetween, { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <Text style={[typography.body, { color: colors.textSecondary }]}>Body Fat (Est.)</Text>
                      <Text style={[typography.bodyStrong, { color: colors.text }]}>{state.bodyFatDisplay}</Text>
                    </View>
                    <View style={[layout.rowAlign, layout.rowBetween, { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <Text style={[typography.body, { color: colors.textSecondary }]}>Lean Mass (Est.)</Text>
                      <Text style={[typography.bodyStrong, { color: colors.text }]}>{state.leanMassDisplay}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))}
        </BottomSheetScrollView>
        <View style={[layout.row, { gap: spacing.md, marginTop: spacing.lg }]}>
          {measurement && (
            <Button
              leftIcon={<LucideTrash size={20} color={colors.danger} />}
              variant="outline"
              loading={state.isDeletePending}
              onPress={state.handleDelete}
              size="sm"
            />
          )}
          <Button
            variant="outline"
            leftIcon={<LucideX size={20} color={colors.text} />}
            onPress={() => {
              state.reset()
              dismiss()
            }}
            size="sm"
          />
          <Button
            title={measurement ? 'Save' : 'Add'}
            style={[layout.flex1]}
            loading={state.isPending}
            disabled={!state.isDirty || !state.isValid}
            onPress={state.handleSubmit(state.onSubmit)}
            size="sm"
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}))
MeasurementsModal.displayName = 'MeasurementsModal'
