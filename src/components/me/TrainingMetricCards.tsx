import { convertWeight } from '@/utils/converter'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

interface TrainingMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor: string
  width: number
  onPress?: () => void
}

function TrainingMetricCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  width,
  onPress,
}: TrainingMetricCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width, height: width * 0.8 }}
      className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </Text>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>

      <View>
        <Text className="text-2xl font-bold text-black dark:text-white">{value}</Text>
        {subtitle && (
          <Text className="text-xs text-neutral-500 dark:text-neutral-500">{subtitle}</Text>
        )}
      </View>
    </Pressable>
  )
}

export function WeeklyVolumeCard({
  volume,
  lastWeekVolume,
  unit,
  width,
}: {
  volume: number
  lastWeekVolume: number
  unit: string
  width: number
}) {
  const displayVolume = convertWeight(volume, { from: 'kg', to: unit as any, precision: 0 })
  const diff = volume - lastWeekVolume
  const isPositive = diff >= 0

  return (
    <TrainingMetricCard
      title="Weekly Volume"
      value={`${displayVolume.toLocaleString()} ${unit}`}
      subtitle={
        lastWeekVolume > 0
          ? `${isPositive ? '+' : ''}${Math.round((diff / lastWeekVolume) * 100)}% from last week`
          : 'First week tracked'
      }
      icon={isPositive ? 'trending-up' : 'trending-down'}
      iconColor={isPositive ? '#22c55e' : '#ef4444'}
      width={width}
      onPress={() => router.push('/analytics/volume-chart')}
    />
  )
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function WeeklyDurationCard({
  duration,
  lastWeekDuration,
  width,
}: {
  duration: number
  lastWeekDuration: number
  width: number
}) {
  const diff = duration - lastWeekDuration
  const isPositive = diff >= 0

  return (
    <TrainingMetricCard
      title="Total Time"
      value={formatDuration(duration)}
      subtitle={
        lastWeekDuration > 0
          ? `${isPositive ? '+' : ''}${Math.round((diff / lastWeekDuration) * 100)}% from last week`
          : 'Active session time'
      }
      icon="clock-outline"
      iconColor="#8b5cf6"
      width={width}
      onPress={() => router.push('/analytics/duration-chart')}
    />
  )
}

export function WeeklyRepsCard({
  reps,
  lastWeekReps,
  width,
}: {
  reps: number
  lastWeekReps: number
  width: number
}) {
  const diff = reps - lastWeekReps
  const isPositive = diff >= 0

  return (
    <TrainingMetricCard
      title="Weekly Reps"
      value={reps.toLocaleString()}
      subtitle={
        lastWeekReps > 0
          ? `${isPositive ? '+' : ''}${Math.round((diff / lastWeekReps) * 100)}% from last week`
          : 'Total movements'
      }
      icon="repeat"
      iconColor="#f59e0b"
      width={width}
      onPress={() => router.push('/analytics/reps-chart')}
    />
  )
}
