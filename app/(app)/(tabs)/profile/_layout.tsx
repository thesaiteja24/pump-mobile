import CustomHeader from '@/components/navigation/CustomHeader'
import { Stack } from 'expo-router'
import React from 'react'

export default function ProfileLayout() {
	return (
		<Stack
			screenOptions={{
				contentStyle: {
					backgroundColor: '#000000',
				},
				header: props => {
					const { options } = props
					const custom = options as any

					if (options.headerShown === false) return null

					return (
						<CustomHeader
							title={options.title ?? ''}
							leftIcon={custom.leftIcon}
							onLeftPress={custom.onLeftPress}
							rightIcons={custom.rightIcons}
						/>
					)
				},
			}}
		>
			{/* PROFILE HOME */}
			<Stack.Screen
				name="index"
				options={
					{
						title: 'Profile',
					} as any
				}
			/>
		</Stack>
	)
}
