import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, View } from 'react-native'

import { CustomText } from '@/components/ui/custom-text'
import { useDeleteHabitLogMutation, useUpsertHabitLogMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'

import type { HabitTodayItem } from '@/types/habit'

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function IconButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  const { colorModes, radius, spacing } = useTheme()

  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onPress()
      }}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colorModes.surface.secondary,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          marginLeft: spacing.xxs,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colorModes.text.primary} />
    </Pressable>
  )
}

function PillAction({
  label,
  disabled,
  inverse,
  flex,
  onPress,
}: {
  label: string
  disabled?: boolean
  inverse?: boolean
  flex?: number
  onPress: () => void
}) {
  const { colorModes, radius, spacing } = useTheme()

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onPress()
      }}
      style={({ pressed }) => [
        {
          flex,
          borderRadius: radius.full,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          backgroundColor: inverse ? colorModes.background.inverse : colorModes.surface.secondary,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <CustomText variant="bodySmStrong" color={inverse ? 'inverse' : 'primary'}>{label}</CustomText>
    </Pressable>
  )
}

function BinaryLogControl({ habit }: { habit: HabitTodayItem }) {
  const { colorModes, radius, spacing } = useTheme()
  const upsertLog = useUpsertHabitLogMutation()
  const isReadOnly = habit.source !== 'manual'

  return (
    <Pressable
      disabled={isReadOnly || upsertLog.isPending}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
        upsertLog.mutate({
          habitId: habit.id,
          date: getLocalDateKey(),
          data: { completed: !habit.completed },
        })
      }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          borderRadius: radius.full,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: habit.completed ? colorModes.background.inverse : colorModes.surface.secondary,
          opacity: isReadOnly || upsertLog.isPending ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Ionicons
        name={habit.completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={habit.completed ? colorModes.text.inverse : colorModes.text.primary}
      />
      <CustomText
        variant="bodySmStrong"
        style={{ color: habit.completed ? colorModes.text.inverse : colorModes.text.primary }}
      >
        {habit.completed ? 'Completed' : 'Mark Done'}
      </CustomText>
    </Pressable>
  )
}

function NumericValueSummary({ currentValue, targetValue, unit }: { currentValue: number, targetValue: number, unit: string }) {
  return (
    <View style={{ flex: 1 }}>
      <CustomText variant="bodySmStrong">
        {currentValue}
        {unit}
      </CustomText>
      <CustomText variant="caption" color="muted">
        Target
        {' '}
        {targetValue}
        {unit}
      </CustomText>
    </View>
  )
}

function NumericStepper({
  currentValue,
  disabled,
  onSetValue,
}: {
  currentValue: number
  disabled: boolean
  onSetValue: (value: number) => void
}) {
  return (
    <>
      <IconButton
        icon="remove"
        label="Decrease habit value"
        disabled={disabled || currentValue <= 0}
        onPress={() => onSetValue(Math.max(0, currentValue - 1))}
      />
      <IconButton
        icon="add"
        label="Increase habit value"
        disabled={disabled}
        onPress={() => onSetValue(currentValue + 1)}
      />
    </>
  )
}

function NumericLogControl({ habit }: { habit: HabitTodayItem }) {
  const { spacing } = useTheme()
  const upsertLog = useUpsertHabitLogMutation()
  const deleteLog = useDeleteHabitLogMutation()
  const isReadOnly = habit.source !== 'manual'
  const isPending = upsertLog.isPending || deleteLog.isPending
  const currentValue = habit.todayValue ?? 0
  const targetValue = habit.targetValue ?? 1
  const unit = habit.unit ? ` ${habit.unit}` : ''

  const setValue = (value: number) => {
    upsertLog.mutate({
      habitId: habit.id,
      date: getLocalDateKey(),
      data: { value },
    })
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <NumericValueSummary currentValue={currentValue} targetValue={targetValue} unit={unit} />
        <NumericStepper currentValue={currentValue} disabled={isReadOnly || isPending} onSetValue={setValue} />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <PillAction
          label="Log Target"
          flex={1}
          inverse
          disabled={isReadOnly || isPending}
          onPress={() => setValue(targetValue)}
        />
        <PillAction
          label="Clear"
          disabled={isReadOnly || isPending || currentValue <= 0}
          onPress={() => deleteLog.mutate({ habitId: habit.id, date: getLocalDateKey() })}
        />
      </View>
    </View>
  )
}

export function HabitLogControl({ habit }: { habit: HabitTodayItem }) {
  const { spacing } = useTheme()

  if (habit.source !== 'manual') {
    return (
      <View style={{ paddingTop: spacing.xxs }}>
        <CustomText variant="caption" color="muted">
          Synced automatically from Pump activity.
        </CustomText>
      </View>
    )
  }

  if (habit.trackingType === 'binary') {
    return <BinaryLogControl habit={habit} />
  }

  return <NumericLogControl habit={habit} />
}
