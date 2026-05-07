import { Stack } from 'expo-router'
import React from 'react'

import { AppHeader } from '@/components/common/AppHeader'
import { useThemeColor } from '@/hooks/theme'

export default function WorkoutLayout() {
  const colors = useThemeColor()

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        header: (props) => {
          const { options } = props

          const custom = options as any

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
            title: 'Workout',
          } as any
        }
      />
    </Stack>
  )
}
