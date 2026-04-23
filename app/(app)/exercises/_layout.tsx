import CustomHeader from '@/components/navigation/CustomHeader'
import { router, Stack } from 'expo-router'
import React from 'react'

export default function ExercisesLayout() {
	return (
		<Stack
			screenOptions={{
				animation: 'slide_from_right',
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
						title: 'Exercises',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
					} as any
				}
			/>

			{/* EXERCISE DETAIL */}
			<Stack.Screen
				name="[id]"
				options={
					{
						headerShown: false,
					} as any
				}
			/>
		</Stack>
	)
}
