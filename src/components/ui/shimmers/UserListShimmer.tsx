import { View } from 'react-native'

import { ShimmerWrapper, SkeletonBlock } from './SkeletonBlock'

export const UserListShimmer = () => {
  return (
    <ShimmerWrapper className="flex-1 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <View key={i} className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <SkeletonBlock className="h-14 w-14 rounded-full" />

            <SkeletonBlock className="h-5 w-2/5 rounded-md" />
          </View>

          {/* Follow Button */}
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </View>
      ))}
    </ShimmerWrapper>
  )
}
