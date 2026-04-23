import CustomHeader from '@/components/navigation/CustomHeader'
import { Stack } from 'expo-router'
import React from 'react'

export default function DiscoverLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
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
			{/* EXERCISES LIST */}
			<Stack.Screen
				name="index"
				options={
					{
						title: 'Discover',
					} as any
				}
			/>
		</Stack>
	)
}
