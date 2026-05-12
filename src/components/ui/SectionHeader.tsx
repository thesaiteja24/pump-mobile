import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { useThemeColor } from '@/hooks/theme'

/**
 * SectionHeader component used to display a title for a section with an optional action button.
 * It is commonly used in screens like Home, Workout, and Profile to separate different content areas.
 *
 * @component
 * @example
 * // Standard section header with a title only
 * <SectionHeader title="Recent Workouts" />
 *
 * @example
 * // Section header with an action button (text + icon)
 * <SectionHeader
 *   title="Templates"
 *   actionLabel="See All"
 *   actionIcon="chevron-right"
 *   onActionPress={() => router.push('/templates')}
 * />
 */
export interface SectionHeaderProps {
  /** The title text for the section. */
  title: string
  /** Optional label for the action button rendered on the right. */
  actionLabel?: string
  /** Optional icon name (MaterialCommunityIcons) for the action button. */
  actionIcon?: keyof typeof MaterialCommunityIcons.glyphMap
  /** Optional callback function when the action button or area is pressed. */
  onActionPress?: () => void
  /** Optional Tailwind CSS classes for additional styling. */
  className?: string
}

/**
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 */
export function SectionHeader({
  title,
  actionLabel,
  actionIcon,
  onActionPress,
  className = '',
}: SectionHeaderProps) {
  const colors = useThemeColor()

  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text className="text-xl font-semibold text-black dark:text-white">{title}</Text>

      {(onActionPress || actionLabel || actionIcon) && (
        <TouchableOpacity
          onPress={onActionPress}
          className="flex-row items-center gap-1"
          disabled={!onActionPress}
        >
          {actionLabel && (
            <Text className="text-sm font-medium text-primary">{actionLabel}</Text>
          )}
          {actionIcon && (
            <MaterialCommunityIcons name={actionIcon} size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

export default SectionHeader
