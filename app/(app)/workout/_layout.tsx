import CustomHeader from '@/components/navigation/CustomHeader'
import { router, Stack } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'

export default function WorkoutLayout() {
	return (
		<Stack
			screenOptions={{
				contentStyle: {
					backgroundColor: useColorScheme() === 'dark' ? '#000000' : '#ffffff',
				},
				header: props => {
					const { options } = props

					const custom = options as any

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
				name="start"
				options={
					{
						title: 'Log Your Pump',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
						rightIcons: [
							{
								name: 'checkmark-done',
								onPress: () => {
									// this will be injected from the screen
								},
							},
						],
					} as any
				}
			/>

			<Stack.Screen
				name="[id]"
				options={
					{
						title: 'Workout Details',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
					} as any
				}
			/>

			<Stack.Screen
				name="save"
				options={
					{
						title: 'Save Workout',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
					} as any
				}
			/>
		</Stack>
	)
}
