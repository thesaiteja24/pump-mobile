import CustomHeader from '@/components/ui/CustomHeader'
import { router, Stack } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'

export default function UserProgramLayout() {
  const colorScheme = useColorScheme()

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
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
      <Stack.Screen
        name="[id]"
        options={
          {
            title: 'Active Program',
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
