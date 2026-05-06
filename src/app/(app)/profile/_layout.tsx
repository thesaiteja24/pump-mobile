import CustomHeader from '@/components/ui/CustomHeader'
import { useThemeColor } from '@/hooks/theme'
import { router, Stack } from 'expo-router'
import React from 'react'

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
            <CustomHeader
              title={options.title ?? ''}
              leftIcon={custom.leftIcon}
              onLeftPress={custom.onLeftPress}
              rightIcons={custom.rightIcons}
            />
          )
        },
      }}
    >
      {/* EDIT */}
      <Stack.Screen
        name="edit"
        options={
          {
            title: 'Edit Profile',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => router.back(),
            rightIcons: [
              {
                name: 'checkmark-done',
                disabled: true,
                color: 'green',
              },
            ],
          } as any
        }
      />

      {/* SETTINGS */}
      <Stack.Screen
        name="settings"
        options={
          {
            title: 'Settings',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />

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
