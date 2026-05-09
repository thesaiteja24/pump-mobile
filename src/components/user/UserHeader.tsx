import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { UserEditableAvatar } from '@/components/user/UserEditableAvatar'
import { UserVerifiedBadge } from '@/components/user/UserVerifiedBadge'
import { BaseUser, SelfUser } from '@/types/me'

interface UserHeaderProps {
  user: BaseUser | SelfUser | null
}

export function UserHeader({ user }: UserHeaderProps) {
  const router = useRouter()

  if (!user) return null

  return (
    <View className="flex-row items-center gap-4">
      {/* Left section: Avatar (1/3) */}

      <UserEditableAvatar uri={user.profilePicUrl} size={75} editable={false} />

      {/* Right section: Info (2/3) */}
      <View className="flex-1 gap-1">
        {/* Top: Name and Badge */}
        <View className="flex-row items-center">
          <Text
            className="text-xl font-bold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
          </Text>
          {user.isPro && <UserVerifiedBadge tier={user.proSubscriptionType} size={24} />}
        </View>

        {/* Bottom: Workouts, Followers and Following */}
        <View className="flex-row gap-4">
          <View>
            <Text className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              Workouts
            </Text>
            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {user.workoutsCount}
            </Text>
          </View>

          <Pressable onPress={() => router.push(`/(app)/profile/followers?userId=${user.id}`)}>
            <Text className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              Followers
            </Text>
            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {user.followersCount}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push(`/(app)/profile/following?userId=${user.id}`)}>
            <Text className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              Following
            </Text>
            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {user.followingCount}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default UserHeader
