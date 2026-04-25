import { useThemeColor } from '@/hooks/useThemeColor'
import { SearchedUser } from '@/types/engagement'
import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import { Button } from '../ui/buttons/Button'
import { VerifiedBadge } from '../ui/VerifiedBadge'

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
    <View className="w-full flex-row items-center justify-between py-3" key={id}>
      <View className="w-2/3 flex-row items-center gap-4">
        <Image
          source={profilePicUrl ? { uri: profilePicUrl } : require('../../assets/images/icon.png')}
          style={{
            width: 48,
            height: 48,
            borderRadius: 100,
            borderColor: isDark ? 'white' : '#black',
            borderWidth: 0.25,
          }}
          contentFit="cover"
        />
        <Text className="text-base text-black dark:text-white">
          {firstName} {lastName}
        </Text>
        {isPro && <VerifiedBadge tier={proSubscriptionType} size={28} />}
      </View>
      <Button
        className="min-h-6 w-1/3 py-2"
        variant={isFollowing ? 'secondary' : 'primary'}
        title={isFollowing ? 'Following' : 'Follow'}
        onPress={onPressFollow}
        loading={followLoading}
      />
    </View>
  )
}
