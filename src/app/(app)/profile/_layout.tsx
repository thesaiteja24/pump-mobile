import { router, Stack } from 'expo-router'

import { AppHeader } from '@/components/common/AppHeader'
import { useThemeColor } from '@/hooks/theme'

export default function ProfileLayout() {
  const colors = useThemeColor()

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.background,
        },
        header: (props) => {
          const { options } = props
          const custom = options as any

          if (options.headerShown === false) return null

          return (
            <AppHeader
              title={options.title ?? ''}
              leftIcon={custom.leftIcon}
              onLeftPress={custom.onLeftPress}
              rightIcons={custom.rightIcons}
            />
          )
        },
      }}
    >
      <Stack.Screen name="[id]" />

      {/* FOLLOWING */}
      <Stack.Screen
        name="following"
        options={
          {
            title: 'Following',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />

      {/* FOLLOWERS */}
      <Stack.Screen
        name="followers"
        options={
          {
            title: 'Followers',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />

      {/* SEARCH */}
      <Stack.Screen
        name="search"
        options={
          {
            title: 'Search',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />
    </Stack>
  )
}
