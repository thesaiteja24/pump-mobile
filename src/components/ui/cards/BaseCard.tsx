import * as Haptics from 'expo-haptics'
import React, { memo } from 'react'
import {
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * BaseCard component that serves as a container for grouped information.
 * It follows a compound component pattern, allowing for modular construction
 * using sub-components like Header, Content, Footer, Badge, and Progress.
 *
 * @component
 * @example
 * // Basic card with header and content
 * <BaseCard>
 *   <BaseCard.Header title="Workout Plan" subtitle="Push Day" />
 *   <BaseCard.Content>
 *     <Text>Exercises: Bench Press, Overhead Press...</Text>
 *   </BaseCard.Content>
 * </BaseCard>
 *
 * @example
 * // Clickable card with animation, badge, and progress bar
 * <BaseCard
 *   animated={true}
 *   index={0}
 *   onPress={() => console.log('Card Pressed')}
 * >
 *   <BaseCard.Header
 *     title="Weight Loss Journey"
 *     right={<BaseCard.Badge label="Active" variant="success" />}
 *   />
 *   <BaseCard.Content>
 *     <BaseCard.Progress progress={75} color="green" />
 *   </BaseCard.Content>
 *   <BaseCard.Footer>
 *     <Text>Last updated: 2 days ago</Text>
 *   </BaseCard.Footer>
 * </BaseCard>
 */
export interface BaseCardProps extends PressableProps {
  /** The children to render within the card. Usually sub-components like BaseCard.Header. */
  children: React.ReactNode
  /** Optional Tailwind CSS classes for the card container. */
  className?: string
  /** Whether to apply a slide-in and fade-in animation when the card mounts. */
  animated?: boolean
  /** The index of the card in a list, used to calculate animation delays for a staggered effect. */
  index?: number
  /** Custom styles for the card's container view. */
  containerStyle?: StyleProp<ViewStyle>
}

/**
 * @param {BaseCardProps} props - The props for the BaseCard component.
 */
const BaseCardRoot = ({
  children,
  className = '',
  animated = false,
  index = 0,
  containerStyle,
  onPress,
  ...props
}: BaseCardProps) => {
  const opacity = useSharedValue(animated ? 0 : 1)
  const translateY = useSharedValue(animated ? 20 : 0)

  React.useEffect(() => {
    if (animated) {
      const delay = Math.min(index * 50, 500)
      opacity.value = withDelay(delay, withTiming(1, { duration: 400 }))
      translateY.value = withDelay(
        delay,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
      )
    }
  }, [animated, index, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const containerClassName = `mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 ${className}`

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.(e)
  }

  if (animated) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        style={[animatedStyle, containerStyle]}
        className={containerClassName}
        {...props}
      >
        {children}
      </AnimatedPressable>
    )
  }

  return (
    <Pressable
      onPress={handlePress}
      style={containerStyle}
      className={containerClassName}
      {...props}
    >
      {children}
    </Pressable>
  )
}

/* ──────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────── */

/**
 * Props for the CardHeader sub-component.
 */
export interface CardHeaderProps {
  /** Title text or custom component. */
  title?: React.ReactNode
  /** Subtitle text or custom component. */
  subtitle?: React.ReactNode
  /** Optional component to render on the left of the text (e.g., an icon or avatar). */
  left?: React.ReactNode
  /** Optional component to render on the right side of the header. */
  right?: React.ReactNode
  /** Optional callback when the header area is pressed. */
  onPress?: () => void
  /** Optional Tailwind CSS classes for the header container. */
  className?: string
}

/**
 * Header sub-component for BaseCard.
 * @param {CardHeaderProps} props - The props for the CardHeader component.
 */
const CardHeader = ({ title, subtitle, left, right, onPress, className = '' }: CardHeaderProps) => {
  const content = (
    <View className={`mb-4 flex-row items-center justify-between gap-4 ${className}`}>
      <View className="flex-row items-center gap-4">
        {left}
        <View className="flex-col items-start gap-1">
          {typeof title === 'string' ? (
            <Text className="text-lg font-medium text-black dark:text-white">{title}</Text>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <Text className="line-clamp-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </Text>
          ) : (
            subtitle
          )}
        </View>
      </View>
      {right}
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>
  }

  return content
}

/**
 * Content sub-component for BaseCard. Usually contains the primary body text or information.
 */
const CardContent = ({ children, className = '' }: ViewProps) => (
  <View className={`flex-1 ${className}`}>{children}</View>
)

/**
 * Footer sub-component for BaseCard. Renders at the bottom with a top margin.
 */
const CardFooter = ({ children, className = '' }: ViewProps) => (
  <View className={`mt-4 flex-row items-center gap-4 ${className}`}>{children}</View>
)

/**
 * Props for the CardBadge sub-component.
 */
export interface CardBadgeProps {
  /** The text label for the badge. */
  label: string
  /** Visual variant affecting the badge color scheme. Defaults to 'neutral'. */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'
  /** Optional Tailwind CSS classes for the badge container. */
  className?: string
}

/**
 * Badge sub-component for BaseCard, used to show statuses or categories.
 * @param {CardBadgeProps} props - The props for the CardBadge component.
 */
const CardBadge = ({ label, variant = 'neutral', className = '' }: CardBadgeProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-600 dark:text-green-400',
        }

      case 'warning':
        return {
          container: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-600 dark:text-yellow-400',
        }

      case 'error':
        return {
          container: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-600 dark:text-red-400',
        }

      case 'info':
        return {
          container: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600 dark:text-blue-400',
        }

      case 'purple':
        return {
          container: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-600 dark:text-purple-400',
        }

      default:
        return {
          container: 'bg-neutral-100 dark:bg-neutral-800',
          text: 'text-neutral-600 dark:text-neutral-400',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <View className={`rounded-full px-2 py-1 ${styles.container} ${className}`}>
      <Text className={`text-xs font-bold capitalize ${styles.text}`}>{label}</Text>
    </View>
  )
}

/**
 * Props for the CardProgress sub-component.
 */
export interface CardProgressProps {
  /** The progress percentage (0 to 100). */
  progress: number
  /** The Tailwind color name for the progress bar. Defaults to 'blue'. */
  color?: string
  /** Optional Tailwind CSS classes for the progress container. */
  className?: string
}

/**
 * Progress bar sub-component for BaseCard.
 * @param {CardProgressProps} props - The props for the CardProgress component.
 */
const CardProgress = ({ progress, color = 'blue', className = '' }: CardProgressProps) => (
  <View
    className={`h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 ${className}`}
  >
    <View
      className={`h-full bg-${color}-600`}
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </View>
)

/**
 * Standardized Card component with support for headers, content, footers, badges, and progress bars.
 */
export const BaseCard = Object.assign(memo(BaseCardRoot), {
  /** Renders a standard header for the card. */
  Header: CardHeader,
  /** Renders the main content area of the card. */
  Content: CardContent,
  /** Renders a footer area at the bottom of the card. */
  Footer: CardFooter,
  /** Renders a status badge within the card. */
  Badge: CardBadge,
  /** Renders a progress bar within the card. */
  Progress: CardProgress,
})

export default BaseCard
