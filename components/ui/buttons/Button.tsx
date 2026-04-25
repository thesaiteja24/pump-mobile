import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  useColorScheme,
} from 'react-native'
import { twMerge } from 'tailwind-merge'

/* --------------------------------------------------
   Types
-------------------------------------------------- */

/**
 * Visual variants supported by the Button component.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'warning'

/**
 * Props for the Button component.
 */
export interface ButtonProps extends TouchableOpacityProps {
  /**
   * Button label text.
   */
  title: string

  /**
   * Visual style of the button.
   *
   * @default "secondary"
   */
  variant?: ButtonVariant

  /**
   * Disable interaction and dim the button.
   * Automatically true when `loading` is true.
   *
   * @default false
   */
  disabled?: boolean

  /**
   * Show a loading spinner instead of the label.
   * Automatically disables the button.
   *
   * @default false
   */
  loading?: boolean

  /**
   * Trigger haptic feedback on press.
   *
   * @default true
   */
  haptic?: boolean

  /**
   * Optional icon rendered before the title.
   */
  leftIcon?: React.ReactNode

  /**
   * Optional icon rendered after the title.
   */
  rightIcon?: React.ReactNode

  /**
   * Additional Tailwind classes for the button container.
   */
  className?: string

  /**
   * Additional Tailwind classes for the button text.
   */
  textClassName?: string

  /**
   * Make the button full width.
   *
   * @default false
   */
  fullWidth?: boolean

  /**
   * Optional callback when the button is disabled.
   */
  onDisabledPress?: () => void

  /**
   * Render the button with a frosted liquid glass treatment.
   *
   * @default false
   */
  liquidGlass?: boolean
}

/* --------------------------------------------------
   Component
-------------------------------------------------- */

/**
 * Button
 *
 * A reusable, consistent button component used across the app.
 *
 * Features:
 * - Multiple visual variants
 * - Built-in loading & disabled handling
 * - Optional haptic feedback
 * - Icon support
 * - Full-width, rounded, accessible by default
 *
 * @example
 * <Button
 *   title="Save"
 *   variant="primary"
 *   onPress={handleSave}
 * />
 *
 * @example
 * <Button
 *   title="Delete"
 *   variant="danger"
 *   loading={isDeleting}
 * />
 */
export function Button({
  title,
  variant = 'secondary',
  disabled = false,
  loading = false,
  haptic = true,
  leftIcon,
  rightIcon,
  className = '',
  textClassName = '',
  onPress,
  onDisabledPress,
  liquidGlass = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const isDark = useColorScheme() === 'dark'

  const widthClass = props.fullWidth ? 'w-full' : ''
  const baseClass = liquidGlass
    ? 'min-h-[42px] flex-row items-center justify-center gap-2 overflow-hidden rounded-full px-4 py-2 shadow-sm shadow-black/10 dark:shadow-black/30'
    : 'min-h-[42px] flex-row items-center justify-center gap-2 rounded-2xl px-4 py-2'

  const variantClass: Record<ButtonVariant, string> = {
    primary: liquidGlass
      ? 'border-2 border-blue-500/25 bg-blue-500/18 dark:border-blue-400/20 dark:bg-blue-400/16'
      : 'bg-[#3b82f6]',
    secondary: liquidGlass
      ? 'border-2 border-white/20 bg-white/20 dark:border-white/12 dark:bg-white/8'
      : 'bg-white border border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-800',
    success: liquidGlass
      ? 'border-2 border-emerald-500/25 bg-emerald-500/18 dark:border-emerald-400/20 dark:bg-emerald-400/16'
      : 'bg-green-600',
    danger: liquidGlass
      ? 'border-2 border-red-500/25 bg-red-500/18 dark:border-red-400/20 dark:bg-red-400/16'
      : 'bg-white border border-red-200/60 dark:bg-neutral-900 dark:border-red-800',
    ghost: liquidGlass
      ? 'border-2 border-white/12 bg-white/8 dark:border-white/8 dark:bg-white/5'
      : 'bg-transparent',
    outline: liquidGlass
      ? 'border-2 border-white/15 bg-white/8 dark:border-white/8 dark:bg-white/5'
      : 'bg-transparent border border-neutral-300 dark:border-neutral-700',
    warning: liquidGlass
      ? 'border-2 border-yellow-500/25 bg-yellow-500/18 dark:border-yellow-400/20 dark:bg-yellow-400/16'
      : 'bg-yellow-500',
  }

  const textVariantClass: Record<ButtonVariant, string> = {
    primary: liquidGlass ? 'text-neutral-900 dark:text-white' : 'text-white',
    secondary: liquidGlass ? 'text-neutral-900 dark:text-white' : 'text-black dark:text-white',
    success: liquidGlass ? 'text-neutral-900 dark:text-white' : 'text-white',
    danger: liquidGlass ? 'text-neutral-900 dark:text-white' : 'text-red-600',
    ghost: liquidGlass ? 'text-neutral-900 dark:text-white' : 'text-blue-500',
    outline: liquidGlass
      ? 'text-neutral-900 dark:text-white'
      : 'text-neutral-700 dark:text-neutral-300',
    warning: liquidGlass ? 'text-neutral-900 dark:text-white' : 'text-yellow-500',
  }

  const spinnerColor = liquidGlass
    ? isDark
      ? '#ffffff'
      : '#111827'
    : variant === 'primary'
      ? 'white'
      : '#6b7280'

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      // disabled={isDisabled}
      onPress={(e) => {
        if (isDisabled) {
          onDisabledPress?.()
          return
        }

        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }

        onPress?.(e)
      }}
      className={twMerge(
        baseClass,
        widthClass,
        variantClass[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {liquidGlass && (
        <>
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          {/* <LinearGradient
						pointerEvents="none"
						colors={
							isDark
								? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
								: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)']
						}
						start={{ x: 0.18, y: 0 }}
						end={{ x: 0.82, y: 1 }}
						style={StyleSheet.absoluteFill}
					/> */}
          <View
            pointerEvents="none"
            className={twMerge(
              'absolute inset-0 border',
              variant === 'primary' && 'border-blue-200/30 dark:border-blue-300/15',
              variant === 'secondary' && 'border-white/25 dark:border-white/10',
              variant === 'success' && 'border-emerald-200/30 dark:border-emerald-300/15',
              variant === 'danger' && 'border-red-200/30 dark:border-red-300/15',
              variant === 'ghost' && 'border-white/15 dark:border-white/10',
              variant === 'outline' && 'border-white/15 dark:border-white/10',
              variant === 'warning' && 'border-yellow-200/30 dark:border-yellow-300/15',
            )}
          />
          {/* <View
						pointerEvents="none"
						className={twMerge('absolute inset-x-0 top-0 h-1/2', isDark ? 'bg-white/5' : 'bg-white/25')}
					/> */}
        </>
      )}
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {leftIcon}
          {title && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className={twMerge('text-lg font-semibold', textVariantClass[variant], textClassName)}
            >
              {title}
            </Text>
          )}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  )
}
