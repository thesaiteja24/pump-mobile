import CustomHeader from '@/components/navigation/CustomHeader'
import { router, Stack } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'

export default function ProfileLayout() {
	return (
		<Stack
			screenOptions={{
				contentStyle: {
					backgroundColor: useColorScheme() === 'dark' ? '#000000' : '#ffffff',
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
						rightIcons: [
							{
								name: 'create-outline',
								onPress: () => router.push('/(app)/profile/edit'),
							},
							{
								name: 'settings-outline',
								onPress: () => router.push('/(app)/profile/settings'),
							},
						],
					} as any
				}
			/>
		</Stack>
	)
}
