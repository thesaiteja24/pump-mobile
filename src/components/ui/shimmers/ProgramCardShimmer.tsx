import { View } from 'react-native'

import { ShimmerWrapper, SkeletonBlock } from './SkeletonBlock'

export function ProgramCardShimmer() {
  return (
    <ShimmerWrapper className="h-48 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <View className="flex-col gap-4">
        <SkeletonBlock className="h-6 w-[75%] rounded-[4px]" />
        <SkeletonBlock className="h-4 w-full rounded-[4px]" />
        <SkeletonBlock className="h-4 w-full rounded-[4px]" />
      </View>

      {/* Chips & Action Button */}
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="h-6 w-24 rounded-full" />
        </View>
        <SkeletonBlock className="h-10 w-14 rounded-full" />
      </View>
    </ShimmerWrapper>
  )
}

export default ProgramCardShimmer
