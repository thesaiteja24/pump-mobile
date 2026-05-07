import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'
import { ReactNode } from 'react'

import { Button } from '@/components/ui/buttons/Button'

interface UserMenuItemProps {
  title: string
  onPress: () => void
  leftIcon?: ReactNode
  isDestructive?: boolean
  rightIcon?: ReactNode
}

export function UserMenuItem({
  title,
  onPress,
  leftIcon,
  isDestructive = false,
  rightIcon,
}: UserMenuItemProps) {
  const { colorScheme } = useColorScheme()
  const isDarkMode = colorScheme === 'dark'

  const defaultRightIcon = (
    <MaterialCommunityIcons
      name="chevron-right"
      size={24}
      color={isDarkMode ? '#525252' : '#A3A3A3'}
      className="ml-auto"
    />
  )

  return (
    <Button
      title={title}
      variant="ghost"
      className="justify-start py-4"
      textClassName={
        isDestructive
          ? 'text-base font-medium text-red-600 dark:text-red-500'
          : 'text-base font-medium text-neutral-700 dark:text-neutral-300'
      }
      leftIcon={leftIcon}
      rightIcon={rightIcon ?? defaultRightIcon}
      onPress={onPress}
    />
  )
}
export default UserMenuItem
