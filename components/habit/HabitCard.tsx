import { CustomModal, ModalHandle } from '@/components/ui/modals/CustomModal'
import { TextInput } from '@/components/ui/TextInput'
import {
  useDeleteHabit,
  useHabitLogsQuery,
  useLogHabit,
  useLogWeight,
} from '@/hooks/queries/useHabits'
import { HabitType } from '@/types/habits'
import { toDateKey } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useRef, useState } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import { Button } from '../ui/buttons/Button'
import HeatMap from './HeatMap'

interface HabitCardProps {
  habit: HabitType
}

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  orange: '#f97316',
}

const EMPTY_ARRAY: any[] = []

export const HabitCard = ({ habit }: HabitCardProps) => {
  const { width } = useWindowDimensions()

  // Habit logs from TanStack Query (merged with pending queue entries)
  const { data: allLogs = {} } = useHabitLogsQuery()
  const habitLogs = allLogs[habit.id] || EMPTY_ARRAY

  const heatmapValues = useMemo(() => {
    return habitLogs.map((log) => {
      let intensity = 1
      if (habit.trackingType === 'quantity' && habit.targetValue) {
        intensity = log.value / Number(habit.targetValue)
      }
      return {
        date: log.date,
        count: log.value > 0 ? 1 : 0,
        intensity: Math.min(1, intensity),
      }
    })
  }, [habitLogs, habit.trackingType, habit.targetValue])

  const thisWeekStreak = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    let count = 0
    const loggedDates = new Set(habitLogs.map((l) => toDateKey(new Date(l.date))))

    for (let i = 0; i <= today.getDay(); i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      if (loggedDates.has(toDateKey(d))) {
        count++
      }
    }
    return count
  }, [habitLogs])

  const thisWeekCount = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    let count = 0
    for (let i = 0; i <= today.getDay(); i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const key = toDateKey(d)
      const log = habitLogs.find((l) => toDateKey(new Date(l.date)) === key)
      if (log) {
        count += Number(log.value)
      }
    }
    return count
  }, [habitLogs])

  const habitModalRef = useRef<ModalHandle>(null)
  const [weightValue, setWeightValue] = useState('')

  const handlePress = () => {
    habitModalRef.current?.open()
  }

  const logWeightMutation = useLogWeight()

  const handleWeightSubmit = async () => {
    if (!weightValue || isNaN(Number(weightValue))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Weight',
        text2: 'Please enter a valid number',
      })
      return
    }

    try {
      await logWeightMutation.mutateAsync({
        weight: Number(weightValue),
        date: new Date().toISOString(),
      })
      Toast.show({
        type: 'success',
        text1: 'Weight Logged',
        text2: `Successfully logged ${weightValue} kg`,
      })
      setWeightValue('')
      habitModalRef.current?.close()
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to log weight',
      })
    }
  }

  const [manualValue, setManualValue] = useState('')
  const logHabitMutation = useLogHabit()
  const deleteHabitMutation = useDeleteHabit()

  const handleManualLog = async (val: string) => {
    const numValue = val ? parseFloat(val) : 0
    try {
      await logHabitMutation.mutateAsync({
        habitId: habit.id,
        data: { value: numValue, date: new Date().toISOString() },
      })
      Toast.show({ type: 'success', text1: 'Progress saved!' })
      habitModalRef.current?.close()
      setManualValue('')
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Failed to save progress' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteHabitMutation.mutateAsync(habit.id)
      Toast.show({ type: 'success', text1: 'Habit deleted' })
      habitModalRef.current?.close()
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Failed to delete habit' })
    }
  }

  const handleEdit = () => {
    habitModalRef.current?.close()
    router.push({
      pathname: '/habit',
      params: { id: habit.id },
    } as any)
  }

  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <Pressable
        onPress={handlePress}
        style={{ width: width * 0.5, height: width * 0.4 }}
        className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-2 px-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <View>
          <Text
            numberOfLines={1}
            className="text-base font-medium text-neutral-600 dark:text-neutral-400"
          >
            {habit.title}
          </Text>
          <Text className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
            Last 30 Days
          </Text>
        </View>

        <HeatMap
          values={heatmapValues}
          numDays={30}
          squareSize={10}
          gutter={5}
          layout="fill"
          numRows={3}
          activeColor={COLOR_MAP[habit.colorScheme] || COLOR_MAP.emerald}
        />

        {habit.footerType === 'weeklyStreak' && (
          <View className="mt-1 flex flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-black dark:text-white">
              {thisWeekStreak}/7 this week
            </Text>
          </View>
        )}
        {habit.footerType === 'weeklyCount' && (
          <View className="mt-1 flex flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-black dark:text-white">
              {thisWeekCount} time(s) this week
            </Text>
          </View>
        )}
      </Pressable>

      <CustomModal ref={habitModalRef} title={habit.title}>
        <View className="flex flex-col">
          {/* Manual Habis Logger */}
          {habit.source === 'manual' && (
            <View className="gap-4">
              {habit.trackingType === 'streak' ? (
                <View className="flex-row items-center justify-around py-4">
                  <Button
                    title="No"
                    variant="danger"
                    className="mr-2 flex-1"
                    onPress={() => handleManualLog('0')}
                    loading={logHabitMutation.isPending}
                  />
                  <Button
                    title="Yes"
                    variant="primary"
                    className="ml-2 flex-1"
                    onPress={() => handleManualLog('1')}
                    loading={logHabitMutation.isPending}
                  />
                </View>
              ) : (
                <View className="flex-col gap-4">
                  <TextInput
                    label={`Quantity (${habit.unit || ''})`}
                    placeholder="0.0"
                    keyboardType="numeric"
                    value={manualValue}
                    onChangeText={setManualValue}
                    autoFocus
                  />
                  <Button
                    variant="success"
                    title="Save Progress"
                    onPress={() => handleManualLog(manualValue)}
                    loading={logHabitMutation.isPending}
                  />
                </View>
              )}
            </View>
          )}

          {/* Internal Weight Logger */}
          {habit.source === 'internal' && habit.internalMetricId === 'weight' && (
            <View className="flex flex-col gap-4">
              <TextInput
                label="Weight"
                placeholder="e.g. 75.5"
                keyboardType="numeric"
                value={weightValue}
                onChangeText={setWeightValue}
                className="p-2"
                autoFocus
              />
              <Button
                title="Save Weight"
                onPress={handleWeightSubmit}
                disabled={!weightValue}
                loading={logWeightMutation.isPending}
              />
            </View>
          )}

          {/* Other Internal Habits Info */}
          {habit.source === 'internal' && habit.internalMetricId !== 'weight' && (
            <View className="items-center gap-4 rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-900">
              <Ionicons name="information-circle-outline" size={32} color="#888" />
              <Text className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                This habit is linked to your{' '}
                {habit.internalMetricId === 'workout' ? 'workouts' : 'measurements'}. It updates
                automatically.
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="mt-4 flex-row gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <Button
              title="Edit"
              variant="secondary"
              className="flex-1"
              onPress={handleEdit}
              leftIcon={<Ionicons name="create-outline" size={18} color="#666" />}
            />
            <Button
              title="Delete"
              variant="danger"
              className="flex-1"
              onPress={handleDelete}
              leftIcon={<Ionicons name="trash-outline" size={18} color="#ef4444" />}
            />
          </View>
        </View>
      </CustomModal>
    </Animated.View>
  )
}
