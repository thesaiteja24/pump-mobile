import { Image, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import type { TopLift } from '@/types/me'

import { SectionHeader } from '../ui'

interface LiftCardProps {
  lift: TopLift
}

function LiftCard({ lift }: LiftCardProps) {
  return (
    <View className="mr-4 w-44 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {lift.thumbnailUrl && (
        <Image
          source={{ uri: lift.thumbnailUrl }}
          className="mb-3 h-20 w-full rounded-xl"
          resizeMode="cover"
        />
      )}

      <Text
        numberOfLines={1}
        className="text-sm font-medium text-neutral-500 dark:text-neutral-400"
      >
        {lift.title}
      </Text>

      <Text className="mt-2 text-xl font-bold text-black dark:text-white">
        {lift.bestSet.weight ?? 0}kg
      </Text>

      <Text className="text-base text-neutral-500 dark:text-neutral-300">
        × {lift.bestSet.reps ?? 0}
      </Text>

      <View className="mt-4 self-start rounded-full bg-neutral-200 px-3 py-1 dark:bg-neutral-800">
        <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          {lift.totalSets} sets
        </Text>
      </View>
    </View>
  )
}

interface TopLiftsProps {
  lifts: TopLift[]
  isLoading?: boolean
  showTitle?: boolean
}

export function TopLifts({ lifts, isLoading, showTitle = true }: TopLiftsProps) {
  if (!isLoading && (!lifts || lifts.length === 0)) {
    return null
  }

  return (
    <View className="gap-4">
      {showTitle && <SectionHeader title="Top Lifts" />}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingRight: 16,
        }}
      >
        {lifts.map((lift) => (
          <LiftCard key={lift.exerciseId} lift={lift} />
        ))}
      </ScrollView>
    </View>
  )
}

export default TopLifts
