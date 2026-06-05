import { memo, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { CustomText } from '@/components/ui/custom-text'
import { useTheme } from '@/hooks/use-theme'

import type { Habit, HabitCategory, HabitCreateInput, HabitTargetPeriod, HabitTrackingType } from '@/types/habit'
import type { Control } from 'react-hook-form'

interface HabitFormValues {
  title: string
  description: string
  category: HabitCategory
  trackingType: HabitTrackingType
  targetPeriod: HabitTargetPeriod
  targetValue: string
  unit: string
}

interface HabitFormProps {
  habit?: Habit | null
  submitLabel: string
  isPending: boolean
  onCancel: () => void
  onSubmit: (payload: HabitCreateInput) => void
}

const categoryOptions: { value: HabitCategory, label: string }[] = [
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'bodyMetrics', label: 'Body Metrics' },
  { value: 'lifestyle', label: 'Lifestyle' },
]

const trackingOptions: { value: HabitTrackingType, label: string }[] = [
  { value: 'binary', label: 'Check-in' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'duration', label: 'Duration' },
  { value: 'count', label: 'Count' },
]

const periodOptions: { value: HabitTargetPeriod, label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultValues(habit?: Habit | null): HabitFormValues {
  if (!habit) {
    return {
      title: '',
      description: '',
      category: 'lifestyle',
      trackingType: 'binary',
      targetPeriod: 'daily',
      targetValue: '',
      unit: '',
    }
  }

  return {
    title: habit.title,
    description: habit.description ?? '',
    category: habit.category,
    trackingType: habit.trackingType,
    targetPeriod: habit.targetPeriod,
    targetValue: habit.targetValue?.toString() ?? '',
    unit: habit.unit ?? '',
  }
}

function buildPayload(values: HabitFormValues): HabitCreateInput {
  const targetValue = Number.parseFloat(values.targetValue)
  const needsTarget = values.trackingType !== 'binary'
  const needsUnit = values.trackingType === 'quantity' || values.trackingType === 'duration'

  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    category: values.category,
    trackingType: values.trackingType,
    targetPeriod: values.targetPeriod,
    targetValue: needsTarget && !Number.isNaN(targetValue) ? targetValue : undefined,
    unit: needsUnit ? values.unit.trim() : undefined,
    startDate: getLocalDateKey(),
  }
}

function OptionSelector<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T, label: string }[]
  onChange: (value: T) => void
}) {
  const { colorModes, radius, spacing } = useTheme()

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => {
        const selected = value === option.value
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              borderWidth: 1,
              borderColor: selected ? colorModes.text.primary : colorModes.border.primary,
              borderRadius: radius.full,
              backgroundColor: selected ? colorModes.background.inverse : colorModes.surface.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <CustomText variant="bodySmStrong" color={selected ? 'inverse' : 'secondary'}>{option.label}</CustomText>
          </Pressable>
        )
      })}
    </View>
  )
}

const TextField = memo(({
  control,
  name,
  label,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  rules,
}: {
  control: Control<HabitFormValues>
  name: keyof Pick<HabitFormValues, 'title' | 'description' | 'targetValue' | 'unit'>
  label: string
  placeholder?: string
  keyboardType?: 'default' | 'decimal-pad'
  multiline?: boolean
  rules?: object
}) => {
  const { colorModes, radius, spacing, typography } = useTheme()

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: spacing.xxs }}>
          <CustomText variant="bodySmStrong" color="secondary">{label}</CustomText>
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={colorModes.text.muted}
            keyboardType={keyboardType}
            multiline={multiline}
            style={[
              typography.body,
              {
                minHeight: multiline ? 88 : 48,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: error ? colorModes.foreground.danger : colorModes.border.primary,
                backgroundColor: colorModes.surface.secondary,
                color: colorModes.text.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                textAlignVertical: multiline ? 'top' : 'center',
              },
            ]}
          />
          {error && <CustomText variant="caption" color="danger">{error.message}</CustomText>}
        </View>
      )}
    />
  )
})
TextField.displayName = 'TextField'

function HabitFormFields({ control }: { control: Control<HabitFormValues> }) {
  const { spacing } = useTheme()

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField control={control} name="title" label="Title" placeholder="Drink water" rules={{ required: 'Title is required' }} />
      <TextField control={control} name="description" label="Description" placeholder="Optional note" multiline />
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="bodySmStrong" color="secondary">Category</CustomText>
            <OptionSelector value={value} options={categoryOptions} onChange={onChange} />
          </View>
        )}
      />
      <Controller
        control={control}
        name="trackingType"
        render={({ field: { onChange, value } }) => (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="bodySmStrong" color="secondary">Tracking</CustomText>
            <OptionSelector value={value} options={trackingOptions} onChange={onChange} />
          </View>
        )}
      />
    </View>
  )
}

function TargetFields({ control, trackingType }: { control: Control<HabitFormValues>, trackingType: HabitTrackingType }) {
  const { spacing } = useTheme()
  const needsTarget = trackingType !== 'binary'
  const needsUnit = trackingType === 'quantity' || trackingType === 'duration'

  if (!needsTarget) {
    return null
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        control={control}
        name="targetValue"
        label="Target"
        placeholder="8"
        keyboardType="decimal-pad"
        rules={{ required: 'Target is required' }}
      />
      {needsUnit && <TextField control={control} name="unit" label="Unit" placeholder="hours, L, minutes" rules={{ required: 'Unit is required' }} />}
      {trackingType === 'count' && (
        <Controller
          control={control}
          name="targetPeriod"
          render={({ field: { onChange, value } }) => (
            <View style={{ gap: spacing.sm }}>
              <CustomText variant="bodySmStrong" color="secondary">Period</CustomText>
              <OptionSelector value={value} options={periodOptions} onChange={onChange} />
            </View>
          )}
        />
      )}
    </View>
  )
}

export function HabitForm({ habit, submitLabel, isPending, onCancel, onSubmit }: HabitFormProps) {
  const { spacing } = useTheme()
  const { control, handleSubmit, reset, watch } = useForm<HabitFormValues>({
    defaultValues: getDefaultValues(habit),
  })
  const trackingType = watch('trackingType')

  useEffect(() => {
    reset(getDefaultValues(habit))
  }, [habit, reset])

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="displaySm">{habit ? 'Edit Habit' : 'Create Habit'}</CustomText>
        <CustomText variant="bodySm" color="secondary">
          Keep this simple. Habits work best when the target is obvious.
        </CustomText>
      </View>

      <HabitFormFields control={control} />
      <TargetFields control={control} trackingType={trackingType} />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Button title="Cancel" variant="outline" size="sm" onPress={onCancel} />
        <Button title={submitLabel} size="sm" loading={isPending} style={{ flex: 1 }} onPress={handleSubmit(values => onSubmit(buildPayload(values)))} />
      </View>
    </View>
  )
}
