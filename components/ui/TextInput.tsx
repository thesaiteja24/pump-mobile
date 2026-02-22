import { useThemeColor } from '@/hooks/useThemeColor'
import React, { forwardRef, useState } from 'react'
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, Text, View } from 'react-native'

export interface TextInputProps extends RNTextInputProps {
	label?: string
	error?: string
	containerClassName?: string
	rightElement?: React.ReactNode
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
	({ label, error, containerClassName, rightElement, ...props }, ref) => {
		const colors = useThemeColor()
		const [isFocused, setIsFocused] = useState(false)

		return (
			<View className={containerClassName}>
				{label && (
					<Text className="mb-1.5 ml-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
						{label}
					</Text>
				)}
				<View
					className={`flex-row items-center rounded-2xl border bg-neutral-50 px-4 py-3 dark:bg-neutral-900 ${
						error
							? 'border-red-500'
							: isFocused
								? 'border-primary'
								: 'border-neutral-200 dark:border-neutral-800'
					}`}
				>
					<RNTextInput
						ref={ref}
						placeholderTextColor={colors.neutral[500]}
						style={{
							flex: 1,
							color: colors.text,
							fontSize: 16,
						}}
						onFocus={e => {
							setIsFocused(true)
							props.onFocus?.(e)
						}}
						onBlur={e => {
							setIsFocused(false)
							props.onBlur?.(e)
						}}
						{...props}
					/>
					{rightElement}
				</View>
				{error && <Text className="ml-1 mt-1 text-xs text-red-500">{error}</Text>}
			</View>
		)
	}
)

TextInput.displayName = 'TextInput'
