import { LucideCheck, LucideCheckCircle, LucideCircle, LucideMinus, LucidePencil, LucidePlus } from 'lucide-react-native'
import { View } from 'react-native'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CustomText } from '@/components/ui/custom-text'
import { useDeleteHabitLogMutation, useUpsertHabitLogMutation } from '@/hooks/queries/use-habits'
import { useTheme } from '@/hooks/use-theme'

import type { HabitCategory, HabitTodayItem, HabitTrackingType } from '@/types/habit'

const categoryLabels: Record<HabitCategory, string> = {
  training: 'Training',
  nutrition: 'Nutrition',
  recovery: 'Recovery',
  bodyMetrics: 'Body Metrics',
  lifestyle: 'Lifestyle',
}

const trackingLabels: Record<HabitTrackingType, string> = {
  binary: 'Check-in',
  quantity: 'Quantity',
  duration: 'Duration',
  count: 'Count',
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatProgress(habit: HabitTodayItem) {
  if (habit.trackingType === 'binary') {
    return habit.completed ? 'Done today' : 'Not logged'
  }

  const value = habit.todayValue ?? 0
  const target = habit.targetValue ?? 0
  const unit = habit.unit ? ` ${habit.unit}` : ''
  return `${value}${unit} / ${target}${unit}`
}

function HabitTodayCardActions({ habit, onEdit }: { habit: HabitTodayItem, onEdit: (id: string) => void }) {
  const { colorModes, spacing } = useTheme()
  const upsertLog = useUpsertHabitLogMutation()
  const deleteLog = useDeleteHabitLogMutation()
  const isPending = upsertLog.isPending || deleteLog.isPending

  const handleToggle = () => {
    if (habit.source !== 'manual')
      return

    if (habit.completed) {
      if (habit.trackingType === 'binary') {
        upsertLog.mutate({ habitId: habit.id, date: getLocalDateKey(), data: { completed: false } })
      }
      else {
        deleteLog.mutate({ habitId: habit.id, date: getLocalDateKey() })
      }
    }
    else {
      if (habit.trackingType === 'binary') {
        upsertLog.mutate({ habitId: habit.id, date: getLocalDateKey(), data: { completed: true } })
      }
      else {
        const targetValue = habit.targetValue ?? 1
        upsertLog.mutate({ habitId: habit.id, date: getLocalDateKey(), data: { value: targetValue } })
      }
    }
  }

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {habit.source === 'manual' && (
        <Button
          accessibilityLabel="Edit habit"
          variant="secondary"
          onPress={() => onEdit(habit.id)}
          leftIcon={<LucidePencil size={18} color={colorModes.text.secondary} />}
          style={{ width: 36, height: 36, paddingHorizontal: 0, paddingVertical: 0 }}
        />
      )}
      <Button
        accessibilityLabel={habit.completed ? 'Undo habit' : 'Log habit'}
        variant={habit.completed ? 'success' : 'secondary'}
        onPress={handleToggle}
        disabled={habit.source !== 'manual' || isPending}
        leftIcon={habit.completed
          ? <LucideCheck size={20} color={colorModes.base.white} />
          : <LucideCircle size={20} color={colorModes.text.muted} />}
        style={{ width: 36, height: 36, paddingHorizontal: 0, paddingVertical: 0 }}
      />
    </View>
  )
}

function IconButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Button
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      variant="secondary"
      leftIcon={icon}
      style={{
        width: 40,
        height: 40,
        paddingHorizontal: 0,
        paddingVertical: 0,
      }}
    />
  )
}

function BinaryLogControl({ habit }: { habit: HabitTodayItem }) {
  const { colorModes } = useTheme()
  const upsertLog = useUpsertHabitLogMutation()
  const isReadOnly = habit.source !== 'manual'

  return (
    <Button
      title={habit.completed ? 'Completed' : 'Mark Done'}
      variant={habit.completed ? 'primary' : 'secondary'}
      leftIcon={habit.completed
        ? <LucideCheckCircle size={20} color={colorModes.text.inverse} />
        : <LucideCircle size={20} color={colorModes.text.primary} />}
      disabled={isReadOnly || upsertLog.isPending}
      onPress={() => {
        upsertLog.mutate({
          habitId: habit.id,
          date: getLocalDateKey(),
          data: { completed: !habit.completed },
        })
      }}
      size="sm"
      style={{ width: '100%' }}
    />
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
  const { colorModes, spacing } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xxs }}>
      <IconButton
        icon={<LucideMinus size={20} color={colorModes.text.primary} />}
        label="Decrease habit value"
        disabled={disabled || currentValue <= 0}
        onPress={() => onSetValue(Math.max(0, currentValue - 1))}
      />
      <IconButton
        icon={<LucidePlus size={20} color={colorModes.text.primary} />}
        label="Increase habit value"
        disabled={disabled}
        onPress={() => onSetValue(currentValue + 1)}
      />
    </View>
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
        <Button
          title="Log Target"
          style={{ flex: 1 }}
          variant="primary"
          size="sm"
          disabled={isReadOnly || isPending}
          onPress={() => setValue(targetValue)}
        />
        <Button
          title="Clear"
          variant="secondary"
          size="sm"
          disabled={isReadOnly || isPending || currentValue <= 0}
          onPress={() => deleteLog.mutate({ habitId: habit.id, date: getLocalDateKey() })}
        />
      </View>
    </View>
  )
}

export function HabitCard({
  habit,
  onEdit,
  onOpen,
}: {
  habit: HabitTodayItem
  onEdit: (habitId: string) => void
  onOpen: (habitId: string) => void
}) {
  const { spacing } = useTheme()

  return (
    <Card style={{ gap: spacing.md }} onPress={() => onOpen(habit.id)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <CustomText variant="bodyStrong">{habit.title}</CustomText>
          <CustomText variant="caption" color="secondary">
            {categoryLabels[habit.category]}
            {' · '}
            {trackingLabels[habit.trackingType]}
          </CustomText>
        </View>
        <HabitTodayCardActions habit={habit} onEdit={onEdit} />
      </View>

      <View style={{ gap: spacing.xxs }}>
        <CustomText variant="displaySm">{formatProgress(habit)}</CustomText>
        <CustomText variant="caption" color="muted">
          {habit.currentStreak > 0 ? `${habit.currentStreak} period streak` : 'Build a streak by logging this habit'}
        </CustomText>
      </View>

      {habit.source !== 'manual'
        ? (
            <View>
              <CustomText variant="caption" color="muted">
                Synced automatically from Pump activity.
              </CustomText>
            </View>
          )
        : habit.trackingType === 'binary'
          ? (
              <BinaryLogControl habit={habit} />
            )
          : (
              <NumericLogControl habit={habit} />
            )}
    </Card>
  )
}
