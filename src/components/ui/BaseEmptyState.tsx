import React from 'react'
import { Text, View } from 'react-native'

import { Button } from './buttons'

/**
 * BaseEmptyState component used to display a placeholder when a screen or section has no data.
 * It supports an optional icon, title, description, and an action button.
 *
 * @component
 * @example
 * // Simple empty state with a message and dashed border
 * <BaseEmptyState
 *   message="No Personal Records"
 *   description="Finish a workout to see your PRs here."
 *   dashed={true}
 * />
 *
 * @example
 * // Empty state with an icon and a call to action button
 * <BaseEmptyState
 *   message="No Templates Found"
 *   icon={<MaterialCommunityIcons name="clipboard-text-outline" size={48} color="gray" />}
 *   actionLabel="Create Template"
 *   onActionPress={handleCreateTemplate}
 *   dashed={false}
 * />
 */
export interface BaseEmptyStateProps {
  /** The primary message to display. */
  message: string
  /** An optional secondary description for more context. */
  description?: string
  /** Optional label for a call-to-action button. */
  actionLabel?: string
  /** Callback function triggered when the action button is pressed. */
  onActionPress?: () => void
  /** Whether to show a dashed border (true) or a solid background (false). Defaults to true. */
  dashed?: boolean
  /** Optional Tailwind CSS classes for additional styling. */
  className?: string
  /** Optional custom icon or component to render above the message. */
  icon?: React.ReactNode
}

/**
 * @param {BaseEmptyStateProps} props - The props for the BaseEmptyState component.
 */
export function BaseEmptyState({
  message,
  description,
  actionLabel,
  onActionPress,
  dashed = true,
  className = '',
  icon,
}: BaseEmptyStateProps) {
  return (
    <View
      className={`items-center justify-center rounded-2xl p-6 ${
        dashed
          ? 'border border-dashed border-neutral-300 dark:border-neutral-700'
          : 'bg-neutral-50 dark:bg-neutral-900/50'
      } ${className}`}
    >
      {icon && <View className="mb-4">{icon}</View>}
      
      <Text className="text-center text-base font-medium text-black dark:text-white">
        {message}
      </Text>
      
      {description && (
        <Text className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </Text>
      )}

      {actionLabel && onActionPress && (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          variant="secondary"
          className="mt-4"
        />
      )}
    </View>
  )
}

export default BaseEmptyState
