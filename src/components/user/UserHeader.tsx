import { useRouter } from 'expo-router'
import { Pressable, Text, View, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { UserEditableAvatar } from '@/components/user/UserEditableAvatar'
import { UserVerifiedBadge } from '@/components/user/UserVerifiedBadge'
import { SelfUser } from '@/types/me'

interface UserHeaderProps {
  user: SelfUser | null
  isPro: boolean
  activePlanId?: string | null
  avatarStyle?: ViewStyle | any
  nameStyle?: ViewStyle | any
}

export function UserHeader({
  user,
  isPro,
  activePlanId,
  avatarStyle,
  nameStyle,
}: UserHeaderProps) {
  const router = useRouter()

  return (
    <View className="flex-row items-center gap-4">
      <Animated.View style={avatarStyle} className="mb-6 items-center">
        <UserEditableAvatar
          uri={user?.profilePicUrl ? user.profilePicUrl : null}
          size={100}
          editable={false}
        />
      </Animated.View>

      {/* Name as prominent line */}
      <Animated.View style={nameStyle} className="mb-3 min-w-0 flex-1 gap-2">
        <View className="flex-row items-center gap-1">
          <Text
            className="shrink text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {(user?.firstName ?? '') + (user?.lastName ? ` ${user.lastName}` : '')}
          </Text>
          {isPro && <UserVerifiedBadge tier={activePlanId ?? null} size={28} />}
        </View>

        <View className="flex-row gap-4">
          <Pressable
            onPress={() => {
              router.push('/(app)/profile/followers')
            }}
          >
            <Text className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
              Followers
            </Text>
            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              {user?.followersCount ?? 0}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              router.push('/(app)/profile/following')
            }}
          >
            <Text className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
              Following
            </Text>
            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              {user?.followingCount ?? 0}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  )
}
export default UserHeader
