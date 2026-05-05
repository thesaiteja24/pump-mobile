import { useThemeColor } from '@/hooks/theme'
import { SearchedUser } from '@/types/engagement'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import { VerifiedBadge } from '../subscriptions/VerifiedBadge'
import { Button } from '../ui/buttons/Button'

export const UserItem = ({
  id,
  firstName,
  lastName,
  profilePicUrl,
  isFollowing,
  isPro,
  proSubscriptionType,
  onPressFollow,
  followLoading,
}: SearchedUser & {
  onPressFollow: () => void
}) => {
  const isDark = useThemeColor().isDark
  return (
    <View className="w-full flex-row items-center justify-between px-4 py-3" key={id}>
      {/* LEFT SECTION */}
      <View className="w-2/3 flex-row items-center gap-3">
        <Image
          source={profilePicUrl ? { uri: profilePicUrl } : require('../../assets/images/icon.png')}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderColor: isDark ? '#fff' : '#e5e7eb',
            borderWidth: 0.5,
          }}
          contentFit="cover"
        />

        {/* NAME + BADGE */}
        <View className="flex-1 flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="flex-shrink text-base font-medium text-black dark:text-white"
          >
            {firstName} {lastName}
          </Text>

          {isPro && (
            <View className="justify-center">
              <VerifiedBadge tier={proSubscriptionType} size={20} />
            </View>
          )}
        </View>
      </View>

      {/* RIGHT SECTION */}
      <View className="w-1/3">
        <Button
          className="rounded-full"
          variant={isFollowing ? 'secondary' : 'primary'}
          title={isFollowing ? 'Following' : 'Follow'}
          onPress={onPressFollow}
          loading={followLoading}
        />
      </View>
    </View>
  )
}
