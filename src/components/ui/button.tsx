import * as Haptics from 'expo-haptics'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable } from 'react-native'

import { CustomText } from '@/components/ui/custom-text'
import { useTheme } from '@/hooks/use-theme'

import type { ThemeColorModes, ThemeRadius, ThemeSpacing } from '@/hooks/use-theme'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'

export interface ButtonProps {
  title?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  disabled?: boolean
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'info' | 'outline' | 'ghost' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  durationSeconds?: number
  cooldownTrigger?: number | string
}

function getVariantStyles(variant: string, colorModes: ThemeColorModes) {
  switch (variant) {
    case 'success':
      return { backgroundColor: colorModes.foreground.success, color: colorModes.base.white, borderWidth: 0, borderColor: 'transparent' }
    case 'info':
      return { backgroundColor: colorModes.foreground.info, color: colorModes.base.white, borderWidth: 0, borderColor: 'transparent' }
    case 'secondary':
      return { backgroundColor: colorModes.surface.secondary, color: colorModes.text.primary, borderWidth: 0, borderColor: 'transparent' }
    case 'outline':
      return { backgroundColor: 'transparent', borderColor: colorModes.border.primary, borderWidth: 1, color: colorModes.text.primary }
    case 'ghost':
      return { backgroundColor: 'transparent', color: colorModes.text.primary, borderWidth: 0, borderColor: 'transparent' }
    case 'danger':
      return { backgroundColor: colorModes.foreground.danger, color: colorModes.base.white, borderWidth: 0, borderColor: 'transparent' }
    case 'warning':
      return { backgroundColor: colorModes.foreground.warning, color: colorModes.base.black, borderWidth: 0, borderColor: 'transparent' }
    case 'primary':
    default:
      return { backgroundColor: colorModes.background.inverse, color: colorModes.text.inverse, borderWidth: 0, borderColor: 'transparent' }
  }
}

function getSizeStyles(size: string, spacing: ThemeSpacing, radius: ThemeRadius) {
  switch (size) {
    case 'sm':
      return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill }
    case 'lg':
      return { paddingVertical: spacing.lg, paddingHorizontal: 28, borderRadius: radius.pill }
    case 'md':
    default:
      return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.pill }
  }
}

const baseStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'center',
  alignSelf: 'center',
}

function computeSeconds(durationSeconds?: number, cooldownTrigger?: number | string): number {
  if (!cooldownTrigger)
    return 0
  const triggerMs = typeof cooldownTrigger === 'number' ? cooldownTrigger : Number(cooldownTrigger)
  if (!Number.isNaN(triggerMs) && triggerMs > 0) {
    return Math.max(0, (durationSeconds || 60) - Math.floor((Date.now() - triggerMs) / 1000))
  }
  return 0
}

function useButtonCooldown(durationSeconds?: number, cooldownTrigger?: number | string) {
  const [secondsLeft, setSecondsLeft] = useState(() => computeSeconds(durationSeconds, cooldownTrigger))

  // Sync seconds when the cooldownTrigger prop changes (new OTP sent, new cooldown started).
  useEffect(() => {
    // Intentional: derived state reset when the trigger identity changes.
    // This is not a render-loop — it only fires when cooldownTrigger or durationSeconds changes.
    // eslint-disable-next-line react/set-state-in-effect
    setSecondsLeft(computeSeconds(durationSeconds, cooldownTrigger))
  }, [cooldownTrigger, durationSeconds])

  // Run the countdown interval. Recomputes from the original timestamp every tick
  // to avoid drift — no decrement, just recalculate elapsed time.
  useEffect(() => {
    const initial = computeSeconds(durationSeconds, cooldownTrigger)
    if (initial <= 0)
      return

    const interval = setInterval(() => {
      const remaining = computeSeconds(durationSeconds, cooldownTrigger)
      setSecondsLeft(remaining)
      if (remaining <= 0)
        clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [cooldownTrigger, durationSeconds])

  return secondsLeft
}

/**
 * Universal, cross-platform interactive Button component.
 * Uses Pressable for advanced interaction states and triggers medium haptics on press.
 */
export const Button = memo(({
  title,
  leftIcon,
  rightIcon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  durationSeconds,
  cooldownTrigger,
}: ButtonProps) => {
  const { colorModes, spacing, radius } = useTheme()
  const secondsLeft = useButtonCooldown(durationSeconds, cooldownTrigger)
  const isDisabled = disabled || loading || secondsLeft > 0

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
      onPress?.()
    }
  }, [isDisabled, onPress])

  const variantStyles = useMemo(() => getVariantStyles(variant, colorModes), [variant, colorModes])
  const sizeStyles = useMemo(() => getSizeStyles(size, spacing, radius), [size, spacing, radius])

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        baseStyle,
        { opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1, gap: spacing.sm },
        variantStyles,
        sizeStyles,
        style,
      ]}
    >
      {loading
        ? (
            <ActivityIndicator color={variantStyles.color} size="small" />
          )
        : (
            <>
              {leftIcon}
              {title && (
                <CustomText variant="bodyStrong" weight="semibold" style={[{ color: variantStyles.color }, textStyle]}>
                  {title}
                  {secondsLeft > 0 ? ` (${secondsLeft}s)` : ''}
                </CustomText>
              )}
              {rightIcon}
            </>
          )}
    </Pressable>
  )
})
