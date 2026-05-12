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

export interface BaseCardProps extends PressableProps {
  children: React.ReactNode
  className?: string
  animated?: boolean
  index?: number
  containerStyle?: StyleProp<ViewStyle>
}

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

export interface CardHeaderProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
  onPress?: () => void
  className?: string
}

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

const CardContent = ({ children, className = '' }: ViewProps) => (
  <View className={`flex-1 ${className}`}>{children}</View>
)

const CardFooter = ({ children, className = '' }: ViewProps) => (
  <View className={`mt-4 flex-row items-center gap-4 ${className}`}>{children}</View>
)

export interface CardBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'
  className?: string
}

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

export interface CardProgressProps {
  progress: number // 0 to 100
  color?: string
  className?: string
}

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

export const BaseCard = Object.assign(memo(BaseCardRoot), {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
  Badge: CardBadge,
  Progress: CardProgress,
})

export default BaseCard
