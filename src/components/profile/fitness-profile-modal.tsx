import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import React, { memo, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, TouchableOpacity, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { useFitnessProfileQuery, useUpsertFitnessProfileMutation } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { useUnitConverter } from '@/hooks/use-unit-converter'
import { Arise } from '@/lib/arise'

import type { ActivityLevel, FitnessGoal, FitnessLevel } from '@/types/user'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'
import type { Control } from 'react-hook-form'

interface FormValues {
  fitnessGoal: FitnessGoal
  activityLevel: ActivityLevel
  fitnessLevel: FitnessLevel
  targetWeight: string
}

const GOAL_OPTIONS: { value: FitnessGoal, label: string }[] = [
  { value: 'loseWeight', label: 'Lose Weight' },
  { value: 'gainMuscle', label: 'Gain Muscle' },
  { value: 'improveStrength', label: 'Improve Strength' },
  { value: 'improveOverallFitness', label: 'Overall Fitness' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel, label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightlyActive', label: 'Lightly Active' },
  { value: 'moderatelyActive', label: 'Moderately Active' },
  { value: 'veryActive', label: 'Very Active' },
  { value: 'athlete', label: 'Athlete' },
]

const LEVEL_OPTIONS: { value: FitnessLevel, label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

interface OptionSelectorProps<T> {
  options: { value: T, label: string }[]
  value: T
  onChange: (value: T) => void
}

function OptionSelectorImpl<T extends string>({ options, value, onChange }: OptionSelectorProps<T>) {
  const { colors, spacing, radius, typography, layout } = useTheme()
  return (
    <View style={[layout.row, { flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }]}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: selected ? colors.text : colors.border,
              backgroundColor: selected ? colors.text : 'transparent',
            }}
          >
            <Text style={[typography.bodySmStrong, { color: selected ? colors.card : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const OptionSelector = memo(OptionSelectorImpl) as <T extends string>(props: OptionSelectorProps<T>) => React.ReactElement

const TargetWeightInput = memo(({ control, weightUnit }: { control: Control<FormValues>, weightUnit: string }) => {
  const { colors, spacing, typography, layout } = useTheme()
  return (
    <Controller
      control={control}
      name="targetWeight"
      rules={{
        validate: (val) => {
          if (!val)
            return true
          const num = Number.parseFloat(val)
          if (Number.isNaN(num) || num <= 0) {
            return 'Invalid Number'
          }
          return true
        },
      }}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md, marginBottom: spacing.lg }}>
          <View style={[layout.rowAlign, layout.rowBetween]}>
            <Text style={[typography.body, { color: colors.text }]}>
              Target Weight (
              {weightUnit}
              )
            </Text>
            <BottomSheetTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="--"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[typography.bodyLg, { color: colors.text, textAlign: 'right', minWidth: 80 }]}
            />
          </View>
          {error && (
            <Text style={[typography.caption, { color: colors.danger, textAlign: 'right', marginTop: spacing.xxs }]}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  )
})
TargetWeightInput.displayName = 'TargetWeightInput'

const FitnessProfileForm = memo(({ onClose }: { onClose: () => void }) => {
  const { colors, spacing, radius, typography, layout } = useTheme()
  const { data: fitnessProfile } = useFitnessProfileQuery()
  const { weightUnit, toCanonicalWeight, formatWeight } = useUnitConverter()
  const upsertFitnessProfile = useUpsertFitnessProfileMutation()

  const { control, handleSubmit, reset, formState: { isValid, isDirty } } = useForm<FormValues>({ mode: 'onChange' })

  useEffect(() => {
    if (fitnessProfile) {
      reset({
        fitnessGoal: fitnessProfile.fitnessGoal || 'loseWeight',
        activityLevel: fitnessProfile.activityLevel || 'sedentary',
        fitnessLevel: fitnessProfile.fitnessLevel || 'beginner',
        targetWeight: fitnessProfile.targetWeight ? formatWeight(fitnessProfile.targetWeight).toString() : '',
      })
    }
  }, [fitnessProfile, reset, formatWeight])

  const onSubmit = (data: FormValues) => {
    const targetW = Number.parseFloat(data.targetWeight)
    const canonicalWeight = !Number.isNaN(targetW) && targetW > 0 ? Number(toCanonicalWeight(targetW).toFixed(2)) : undefined

    upsertFitnessProfile.mutate({
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      fitnessLevel: data.fitnessLevel,
      targetWeight: canonicalWeight,
    }, {
      onSuccess: () => {
        Arise.success('Fitness profile updated successfully!')
        onClose()
      },
      onError: (err: Error) => {
        Arise.error(err.message || 'Failed to update fitness profile.')
      },
    })
  }

  return (
    <View>
      <BottomSheetScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
        <Text style={[typography.bodySmStrong, { color: colors.text, marginBottom: spacing.sm }]}>Primary Goal</Text>
        <Controller control={control} name="fitnessGoal" render={({ field: { onChange, value } }) => <OptionSelector options={GOAL_OPTIONS} value={value} onChange={onChange} />} />
        <Text style={[typography.bodySmStrong, { color: colors.text, marginBottom: spacing.sm }]}>Activity Level</Text>
        <Controller control={control} name="activityLevel" render={({ field: { onChange, value } }) => <OptionSelector options={ACTIVITY_OPTIONS} value={value} onChange={onChange} />} />
        <Text style={[typography.bodySmStrong, { color: colors.text, marginBottom: spacing.sm }]}>Experience Level</Text>
        <Controller control={control} name="fitnessLevel" render={({ field: { onChange, value } }) => <OptionSelector options={LEVEL_OPTIONS} value={value} onChange={onChange} />} />
        <TargetWeightInput control={control} weightUnit={weightUnit} />
      </BottomSheetScrollView>

      <View style={[layout.row, { gap: spacing.md, marginTop: spacing.lg }]}>
        <Button leftIcon={<Ionicons name="close" size={24} color={colors.text} />} variant="outline" size="sm" onPress={onClose} />
        <Button title="Save Profile" style={[layout.flex1, { borderRadius: radius.full }]} loading={upsertFitnessProfile.isPending} disabled={!isValid || !isDirty} onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  )
})
FitnessProfileForm.displayName = 'FitnessProfileForm'

export const FitnessProfileModal = memo(({ ref }: { ref?: React.RefObject<BottomSheetMethods | null> }) => {
  const { colors, spacing, typography } = useTheme()

  const handleClose = () => {
    if (ref && ref.current) {
      ref.current.dismiss()
    }
  }

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetView style={{ padding: spacing.lg }}>
        <Text style={[typography.displaySm, { color: colors.text, marginBottom: spacing.sm }]}>Fitness Profile</Text>
        <Text style={[typography.bodySm, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Customize your targets, daily activity factor, and experience tags.
        </Text>

        <FitnessProfileForm onClose={handleClose} />
      </BottomSheetView>
    </BottomSheetModal>
  )
})
FitnessProfileModal.displayName = 'FitnessProfileModal'
export default FitnessProfileModal
