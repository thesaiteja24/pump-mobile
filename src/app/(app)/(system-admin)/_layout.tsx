import CustomHeader from '@/components/ui/CustomHeader'
import { useThemeColor } from '@/hooks/theme'
import { router, Stack } from 'expo-router'
import React from 'react'

export default function SystemAdminLayout() {
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
      {/* Muscle Groups */}
      <Stack.Screen
        name="muscle-groups/create"
        options={
          {
            title: 'Create Muscle Group',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
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
      <Stack.Screen
        name="muscle-groups/[id]"
        options={
          {
            title: 'Edit Muscle Group',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
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

      {/* Equipment */}
      <Stack.Screen
        name="equipment/create"
        options={
          {
            title: 'Create Equipment',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
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
      <Stack.Screen
        name="equipment/[id]"
        options={
          {
            title: 'Edit Equipment',
            leftIcon: 'chevron-back-outline',
            onLeftPress: () => {
              router.back()
            },
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
    </Stack>
  )
}
