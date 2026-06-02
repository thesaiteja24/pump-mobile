import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { memo } from 'react'
import { Text, View } from 'react-native'
import { G, Path, Svg } from 'react-native-svg'

import defaultIcon from '@/assets/icon.png'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTheme } from '@/hooks/use-theme'
import { useAuthStore } from '@/stores/auth-store'

import type { Href } from 'expo-router'

interface ProfileCardProps {
  id?: string
  imageUrl?: string
  firstName: string
  lastName: string
  workoutsCount?: number
  followersCount?: number
  followingCount?: number
  proSubscriptionType?: string | null
  isPro?: boolean
  isFollowing?: boolean
  onPressFollow?: () => void
  followLoading?: boolean
  isSelf?: boolean
}

// ─── UserVerifiedBadge ───────────────────────────────────────────────────────

interface UserVerifiedBadgeProps {
  tier: string | null
  size?: number
}

const UserVerifiedBadge = memo(({ tier, size = 18 }: UserVerifiedBadgeProps) => {
  const { colors: themeColors } = useTheme()
  const colors = {
    monthly: themeColors.accent, // blue
    yearly: themeColors.warning, // gold
    lifetime: themeColors.danger, // red
  }

  const type = tier?.includes('lifetime')
    ? 'lifetime'
    : tier?.includes('year')
      ? 'yearly'
      : 'monthly'

  const roundedPetalSeal
    = 'M10.5213 2.62368C11.3147 1.75255 12.6853 1.75255 13.4787 2.62368L14.4989 3.74391C14.8998 4.18418 15.4761 4.42288 16.071 4.39508L17.5845 4.32435C18.7614 4.26934 19.7307 5.23857 19.6757 6.41554L19.6049 7.92905C19.5771 8.52388 19.8158 9.10016 20.2561 9.50111L21.3763 10.5213C22.2475 11.3147 22.2475 12.6853 21.3763 13.4787L20.2561 14.4989C19.8158 14.8998 19.5771 15.4761 19.6049 16.071L19.6757 17.5845C19.7307 18.7614 18.7614 19.7307 17.5845 19.6757L16.071 19.6049C15.4761 19.5771 14.8998 19.8158 14.4989 20.2561L13.4787 21.3763C12.6853 22.2475 11.3147 22.2475 10.5213 21.3763L9.50111 20.2561C9.10016 19.8158 8.52388 19.5771 7.92905 19.6049L6.41553 19.6757C5.23857 19.7307 4.26934 18.7614 4.32435 17.5845L4.39508 16.071C4.42288 15.4761 4.18418 14.8998 3.74391 14.4989L2.62368 13.4787C1.75255 12.6853 1.75255 11.3147 2.62368 10.5213L3.74391 9.50111C4.18418 9.10016 4.42288 8.52388 4.39508 7.92905L4.32435 6.41553C4.26934 5.23857 5.23857 4.26934 6.41554 4.32435L7.92905 4.39508C8.52388 4.42288 9.10016 4.18418 9.50111 3.74391L10.5213 2.62368Z'

  const sharpSeal
    = 'M12 2L13.7 3.9L16.4 3.7L17.2 6.3L19.8 7.2L19.6 9.9L21.5 11.6L19.6 13.3L19.8 16L17.2 16.9L16.4 19.5L13.7 19.3L12 21.2L10.3 19.3L7.6 19.5L6.8 16.9L4.2 16L4.4 13.3L2.5 11.6L4.4 9.9L4.2 7.2L6.8 6.3L7.6 3.7L10.3 3.9L12 2Z'

  const bgPath = type === 'lifetime' ? sharpSeal : roundedPetalSeal

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G>
        <Path d={bgPath} fill={colors[type]} />
        <Path
          d="M9 12L11 14L15 10"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  )
})
UserVerifiedBadge.displayName = 'UserVerifiedBadge'

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  imageUrl?: string
  firstName: string
  lastName: string
  proSubscriptionType: string | null
  isPro: boolean
}

const ProfileHeader = memo(({ imageUrl, firstName, lastName, proSubscriptionType, isPro }: ProfileHeaderProps) => {
  const { colors, layout, typography, spacing, radius } = useTheme()

  return (
    <View style={[layout.rowAlign, layout.flex1, { gap: spacing.md }]}>
      <Image
        source={imageUrl ? { uri: imageUrl } : defaultIcon}
        style={[
          {
            width: 64,
            height: 64,
            borderWidth: 0.5,
            borderColor: colors.border,
            borderRadius: radius.full,
          },
        ]}
        contentFit="cover"
      />

      <View style={[layout.rowAlign, layout.flex1, { gap: spacing.sm }]}>
        <Text
          numberOfLines={1}
          style={[typography.bodyStrong, { color: colors.text, flexShrink: 1 }]}
        >
          {firstName}
          {' '}
          {lastName}
        </Text>

        {(isPro || proSubscriptionType) && (
          <UserVerifiedBadge tier={proSubscriptionType} />
        )}
      </View>
    </View>
  )
})

ProfileHeader.displayName = 'ProfileHeader'

interface FollowButtonProps {
  isFollowing?: boolean
  onPressFollow?: () => void
  followLoading?: boolean
}

const FollowButton = memo(({ isFollowing, onPressFollow, followLoading }: FollowButtonProps) => {
  const { radius } = useTheme()
  if (!onPressFollow) {
    return null
  }

  return (
    <Button
      style={{ borderRadius: radius.full }}
      variant={isFollowing ? 'secondary' : 'primary'}
      title={isFollowing ? 'Following' : 'Follow'}
      onPress={onPressFollow}
      loading={followLoading}
      size="sm"
    />
  )
})

FollowButton.displayName = 'FollowButton'

interface ProfileStatsProps {
  workoutsCount?: number
  followersCount?: number
  followingCount?: number
}

const ProfileStats = memo(({ workoutsCount = 0, followersCount = 0, followingCount = 0 }: ProfileStatsProps) => {
  const { colors, layout, typography, spacing } = useTheme()

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View
        style={{
          height: 1,
          backgroundColor: colors.border,
          marginBottom: spacing.md,
        }}
      />

      <View style={[layout.rowAlign, layout.rowBetween, layout.wFull]}>
        <View style={[layout.center, layout.flex1]}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {workoutsCount}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Workouts
          </Text>
        </View>

        <View style={[layout.center, layout.flex1]}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {followersCount}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Followers
          </Text>
        </View>

        <View style={[layout.center, layout.flex1]}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {followingCount}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Following
          </Text>
        </View>
      </View>
    </View>
  )
})

ProfileStats.displayName = 'ProfileStats'

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProfileCard = memo((props: ProfileCardProps) => {
  const { layout, spacing } = useTheme()
  const currentUserId = useAuthStore(state => state.user?.id)
  const router = useRouter()

  const isSelf = props.id === currentUserId || props.isSelf || !props.id

  const showStats
    = props.workoutsCount !== undefined
      || props.followersCount !== undefined
      || props.followingCount !== undefined

  const handleCardPress = () => {
    if (props.id) {
      router.push(`/profile/${props.id}` as Href)
    }
  }

  return (
    <Card onPress={isSelf ? handleCardPress : undefined}>
      <View style={[layout.rowAlign, layout.rowBetween, layout.wFull]}>
        <ProfileHeader
          imageUrl={props.imageUrl}
          firstName={props.firstName}
          lastName={props.lastName}
          proSubscriptionType={props.proSubscriptionType ?? null}
          isPro={!!props.isPro}
        />

        {!isSelf && (
          <View style={{ width: '30%', marginLeft: spacing.md }}>
            <FollowButton
              isFollowing={props.isFollowing}
              onPressFollow={props.onPressFollow}
              followLoading={props.followLoading}
            />
          </View>
        )}
      </View>

      {showStats && (
        <ProfileStats
          workoutsCount={props.workoutsCount}
          followersCount={props.followersCount}
          followingCount={props.followingCount}
        />
      )}
    </Card>
  )
})

ProfileCard.displayName = 'ProfileCard'

export default ProfileCard
