import CustomHeader from '@/components/ui/CustomHeader'
import { useThemeColor } from '@/hooks/theme'
import { Stack } from 'expo-router'
import React from 'react'

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
