import { router, Stack } from 'expo-router'
import React from 'react'

import { AppHeader } from '@/components/common/AppHeader'
import { useThemeColor } from '@/hooks/theme'

export default function ExercisesLayout() {
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
      {/* EXERCISES LIST */}
      <Stack.Screen
        name="index"
        options={
          {
            title: 'Exercises',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />

      {/* EXERCISE DETAIL */}
      <Stack.Screen
        name="[id]"
        options={
          {
            headerShown: false,
          } as any
        }
      />
    </Stack>
  )
}
