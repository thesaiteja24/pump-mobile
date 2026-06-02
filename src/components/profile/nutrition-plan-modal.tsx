import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import React, { memo, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { useNutritionPlanQuery, useUpsertNutritionPlanMutation } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { Arise } from '@/lib/arise'

import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'
import type { Control } from 'react-hook-form'

interface FormValues {
  caloriesTarget: string
  proteinTarget: string
  carbsTarget: string
  fatsTarget: string
}

const DEFAULT_VALUES: FormValues = {
  caloriesTarget: '',
  proteinTarget: '',
  carbsTarget: '',
  fatsTarget: '',
}

const FIELDS = [
  { key: 'caloriesTarget' as const, label: 'Calories (kcal)', placeholder: 'e.g. 2000' },
  { key: 'proteinTarget' as const, label: 'Protein (g)', placeholder: 'e.g. 150' },
  { key: 'carbsTarget' as const, label: 'Carbs (g)', placeholder: 'e.g. 200' },
  { key: 'fatsTarget' as const, label: 'Fats (g)', placeholder: 'e.g. 65' },
]

function parseMacro(val: string) {
  const parsed = Number.parseInt(val, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

const NutritionInput = memo(({ label, placeholder, name, control }: {
  label: string
  placeholder: string
  name: 'caloriesTarget' | 'proteinTarget' | 'carbsTarget' | 'fatsTarget'
  control: Control<FormValues>
}) => {
  const { colors, spacing, typography, layout } = useTheme()
  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: name === 'caloriesTarget' ? 'Calorie target is required' : false,
        validate: (val) => {
          if (!val)
            return true
          const num = Number.parseInt(val, 10)
          if (Number.isNaN(num) || num < 0) {
            return 'Invalid Number'
          }
          return true
        },
      }}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md }}>
          <View style={[layout.rowAlign, layout.rowBetween]}>
            <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
            <BottomSheetTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={[typography.bodyLg, { color: colors.text, textAlign: 'right', minWidth: 100 }]}
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
NutritionInput.displayName = 'NutritionInput'

const NutritionPlanForm = memo(({ onClose }: { onClose: () => void }) => {
  const { colors, spacing, radius, layout } = useTheme()
  const { data: nutritionPlan } = useNutritionPlanQuery()
  const upsertNutritionPlan = useUpsertNutritionPlanMutation()

  const { control, handleSubmit, reset, formState: { isValid, isDirty } } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES, mode: 'onChange' })

  useEffect(() => {
    if (nutritionPlan) {
      reset({
        caloriesTarget: nutritionPlan.caloriesTarget?.toString() || '',
        proteinTarget: nutritionPlan.proteinTarget?.toString() || '',
        carbsTarget: nutritionPlan.carbsTarget?.toString() || '',
        fatsTarget: nutritionPlan.fatsTarget?.toString() || '',
      })
    }
  }, [nutritionPlan, reset])

  const onSubmit = (data: FormValues) => {
    const calories = Number.parseInt(data.caloriesTarget, 10)
    if (Number.isNaN(calories) || calories <= 0) {
      Arise.error('Please enter a valid calorie target.')
      return
    }

    upsertNutritionPlan.mutate({
      caloriesTarget: calories,
      proteinTarget: parseMacro(data.proteinTarget),
      carbsTarget: parseMacro(data.carbsTarget),
      fatsTarget: parseMacro(data.fatsTarget),
      startDate: new Date().toISOString(),
    }, {
      onSuccess: () => {
        Arise.success('Nutrition targets updated!')
        onClose()
      },
      onError: (err: Error) => {
        Arise.error(err.message || 'Failed to update nutrition targets.')
      },
    })
  }

  return (
    <View>
      <BottomSheetScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
        {FIELDS.map(field => (
          <NutritionInput key={field.key} label={field.label} placeholder={field.placeholder} name={field.key} control={control} />
        ))}
      </BottomSheetScrollView>

      <View style={[layout.row, { gap: spacing.md, marginTop: spacing.lg }]}>
        <Button leftIcon={<Ionicons name="close" size={24} color={colors.text} />} variant="outline" size="sm" onPress={onClose} />
        <Button title="Save Targets" style={[layout.flex1, { borderRadius: radius.full }]} size="sm" loading={upsertNutritionPlan.isPending} disabled={!isValid || !isDirty} onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  )
})
NutritionPlanForm.displayName = 'NutritionPlanForm'

export const NutritionPlanModal = memo(({ ref }: { ref?: React.RefObject<BottomSheetMethods | null> }) => {
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
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetView style={{ padding: spacing.lg }}>
        <Text style={[typography.displaySm, { color: colors.text, marginBottom: spacing.sm }]}>
          Update Nutrition Plan
        </Text>
        <Text style={[typography.bodySm, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Update your daily calorie and macronutrient intake targets.
        </Text>

        <NutritionPlanForm onClose={handleClose} />
      </BottomSheetView>
    </BottomSheetModal>
  )
})
NutritionPlanModal.displayName = 'NutritionPlanModal'
export default NutritionPlanModal
