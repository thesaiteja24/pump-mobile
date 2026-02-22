import CustomHeader from '@/components/navigation/CustomHeader'
import { router, Stack } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'

export default function ExercisesLayout() {
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
			<Stack.Screen
				name="editor"
				options={
					{
						title: 'Template Editor',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
					} as any
				}
			/>

			<Stack.Screen
				name="[id]"
				options={
					{
						title: 'Template',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => router.back(),
					} as any
				}
			/>

			<Stack.Screen
				name="share/[shareId]"
				options={
					{
						title: 'Shared Template',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							if (router.canGoBack()) {
								router.back()
							}
							router.push('/(app)/(tabs)/workout')
						},
					} as any
				}
			/>
		</Stack>
	)
}
