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
      <Stack.Screen
        name="index"
        options={
          {
            title: 'Analytics',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />
      <Stack.Screen
        name="weight-chart"
        options={
          {
            title: 'Weight Trend',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />
      <Stack.Screen
        name="volume-chart"
        options={
          {
            title: 'Volume Trend',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />
      <Stack.Screen
        name="duration-chart"
        options={
          {
            title: 'Duration Trend',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
          } as any
        }
      />
      <Stack.Screen
        name="reps-chart"
        options={
          {
            title: 'Reps Trend',
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
