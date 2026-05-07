import { Stack } from 'expo-router'
import React from 'react'

import { AppHeader } from '@/components/common/AppHeader'
import { useThemeColor } from '@/hooks/theme'

export default function HomeLayout() {
  const colors = useThemeColor()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
            title: 'Home',
          } as any
        }
      />
    </Stack>
  )
}
