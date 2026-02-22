import * as Haptics from 'expo-haptics'
import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { twMerge } from 'tailwind-merge'

/* --------------------------------------------------
   Types
-------------------------------------------------- */

/**
 * Visual variants supported by the Button component.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline'

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
	...props
}: ButtonProps) {
	const isDisabled = disabled || loading

	const widthClass = props.fullWidth ? 'w-full' : ''
	const baseClass = 'min-h-[42px] flex-row items-center justify-center gap-2 rounded-2xl px-4 py-2'

	const variantClass: Record<ButtonVariant, string> = {
		primary: `bg-[#3b82f6]`,
		secondary: 'bg-white border border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-800',
		success: 'bg-green-600',
		danger: 'bg-white border border-red-200/60 dark:bg-neutral-900 dark:border-red-800',
		ghost: 'bg-transparent',
		outline: 'bg-transparent border border-neutral-300 dark:border-neutral-700',
	}

	const textVariantClass: Record<ButtonVariant, string> = {
		primary: 'text-white',
		secondary: 'text-black dark:text-white',
		success: 'text-white',
		danger: 'text-red-600',
		ghost: 'text-blue-500',
		outline: 'text-neutral-700 dark:text-neutral-300',
	}

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			// disabled={isDisabled}
			onPress={e => {
				if (isDisabled) {
					onDisabledPress?.()
					return
				}

				if (haptic) {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
				}

				onPress?.(e)
			}}
			className={twMerge(baseClass, widthClass, variantClass[variant], isDisabled && 'opacity-50', className)}
			{...props}
		>
			{loading ? (
				<ActivityIndicator size="small" color={variant === 'primary' ? 'white' : '#6b7280'} />
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
