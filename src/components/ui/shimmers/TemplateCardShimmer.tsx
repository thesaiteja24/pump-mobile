import { View } from 'react-native'

import { ShimmerWrapper, SkeletonBlock } from './SkeletonBlock'

export function TemplateCardShimmer() {
  return (
    <ShimmerWrapper className="h-44 flex-col justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <View className="flex-col justify-between gap-2">
        <View className="flex-row items-center justify-between gap-4">
          <SkeletonBlock className="h-5 w-[60%] rounded-[6px]" />
        </View>
        <SkeletonBlock className="h-[14px] w-[40%] rounded-[4px]" />
      </View>

      {/* Button skeleton */}
      <SkeletonBlock className="h-10 w-full rounded-[12px]" />
    </ShimmerWrapper>
  )
}

export default TemplateCardShimmer
