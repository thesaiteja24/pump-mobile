import CustomHeader from '@/components/ui/CustomHeader'
import { useThemeColor } from '@/hooks/theme'
import { Stack } from 'expo-router'
import React from 'react'

export default function DiscoverLayout() {
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
      {/* EXERCISES LIST */}
      <Stack.Screen
        name="index"
        options={
          {
            title: 'Discover',
          } as any
        }
      />
    </Stack>
  )
}
