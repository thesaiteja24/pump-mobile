import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native'

interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>)
}

/**
 * Standard card surface using the backgroundCard token, xl radius, and lg padding.
 * If onPress is provided, it triggers light haptic impact feedback automatically.
 */
export function Card({ children, style, onPress, ...props }: CardProps) {
  const { colors, radius, spacing } = useTheme()

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      onPress(event)
    }
  }

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      style={state => [
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          padding: spacing.lg,
        },
        state.pressed && onPress && { opacity: 0.9 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  )
}
