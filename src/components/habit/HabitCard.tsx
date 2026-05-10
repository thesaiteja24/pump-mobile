import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { TextInput } from '@/components/ui/inputs/TextInput'
import {
  useDeleteHabit,
  useHabitLogsQuery,
  useLogHabit,
  useLogWeight,
} from '@/hooks/queries/habits'
import { Arise } from '@/lib/arise'
import { HabitLogType, HabitType } from '@/types/habits'

import { HabitHeatMap } from './HabitHeatMap'

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

const EMPTY_ARRAY: HabitLogType[] = []

export const HabitCard = ({ habit }: HabitCardProps) => {
  const router = useRouter()
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
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    let count = 0
    const loggedDates = new Set(habitLogs.map((l) => format(new Date(l.date), 'yyyy-MM-dd')))

    const daysPassed = day === 0 ? 6 : day - 1
    for (let i = 0; i <= daysPassed; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      if (loggedDates.has(format(d, 'yyyy-MM-dd'))) {
        count++
      }
    }
    return count
  }, [habitLogs])

  const thisWeekCount = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    let count = 0
    const daysPassed = day === 0 ? 6 : day - 1
    for (let i = 0; i <= daysPassed; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const key = format(d, 'yyyy-MM-dd')
      const log = habitLogs.find((l) => format(new Date(l.date), 'yyyy-MM-dd') === key)
      if (log) {
        count += Number(log.value)
      }
    }
    return count
  }, [habitLogs])

  const habitModalRef = useRef<BaseModalHandle>(null)
  const [weightValue, setWeightValue] = useState('')

  const handlePress = () => {
    habitModalRef.current?.present()
  }

  const logWeightMutation = useLogWeight()

  const handleWeightSubmit = () => {
    if (!weightValue || isNaN(Number(weightValue))) {
      Arise.error({
        heading: 'Invalid Weight',
        content: 'Please enter a valid number',
      })
      return
    }

    logWeightMutation.mutate(
      {
        weight: Number(weightValue),
        date: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          Arise.success({ heading: 'Weight logged successfully' })
          setWeightValue('')
          habitModalRef.current?.dismiss()
        },
        onError: (error: any) => {
          console.error('Log Weight Error:', error)
          Arise.error({
            heading: error.message || 'Failed to log weight',
          })
        },
      },
    )
  }

  const [manualValue, setManualValue] = useState('')
  const logHabitMutation = useLogHabit()
  const deleteHabitMutation = useDeleteHabit()

  const handleManualLog = (val: string) => {
    const numValue = val ? parseFloat(val) : 0
    logHabitMutation.mutate(
      {
        habitId: habit.id,
        data: { value: numValue, date: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          Arise.success({ heading: 'Progress saved successfully' })
          habitModalRef.current?.dismiss()
          setManualValue('')
        },
        onError: (error: any) => {
          console.error('Log Habit Error:', error)
          Arise.error({
            heading: error.message || 'Failed to save progress',
          })
        },
      },
    )
  }

  const handleDelete = () => {
    deleteHabitMutation.mutate(habit.id, {
      onSuccess: () => {
        Arise.success({ heading: 'Habit deleted successfully' })
        habitModalRef.current?.dismiss()
      },
      onError: (error: any) => {
        console.error('Delete Habit Error:', error)
        Arise.error({
          heading: error.message || 'Failed to delete habit',
        })
      },
    })
  }

  const handleEdit = () => {
    habitModalRef.current?.dismiss()
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

        <HabitHeatMap
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

      <BaseModal
        ref={habitModalRef}
        title={habit.title}
        floating={true}
        editAction={{ onPress: handleEdit }}
        deleteAction={{
          onPress: handleDelete,
          loading: deleteHabitMutation.isPending,
        }}
        confirmAction={
          habit.source === 'manual'
            ? habit.trackingType === 'streak'
              ? {
                  title: 'Yes',
                  onPress: () => handleManualLog('1'),
                  loading: logHabitMutation.isPending,
                }
              : {
                  title: 'Save Progress',
                  onPress: () => handleManualLog(manualValue),
                  loading: logHabitMutation.isPending,
                  disabled: !manualValue,
                }
            : habit.source === 'internal' && habit.internalMetricId === 'weight'
              ? {
                  title: 'Save Weight',
                  onPress: handleWeightSubmit,
                  loading: logWeightMutation.isPending,
                  disabled: !weightValue,
                }
              : undefined
        }
        cancelAction={
          habit.source === 'manual' && habit.trackingType === 'streak'
            ? {
                title: 'No',
                onPress: () => handleManualLog('0'),
                loading: logHabitMutation.isPending,
              }
            : undefined
        }
      >
        <View className="flex flex-col">
          {/* Manual Habis Logger - Only show input if not streak (streak uses footer actions) */}
          {habit.source === 'manual' && habit.trackingType !== 'streak' && (
            <View className="gap-4">
              <TextInput
                label={`Quantity (${habit.unit || ''})`}
                placeholder="0.0"
                keyboardType="numeric"
                value={manualValue}
                onChangeText={setManualValue}
                className="p-2"
                autoFocus
              />
            </View>
          )}

          {/* Internal Weight Logger - Only show input (save uses footer actions) */}
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
        </View>
      </BaseModal>
    </Animated.View>
  )
}
export default HabitCard
