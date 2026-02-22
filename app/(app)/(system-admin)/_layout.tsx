import CustomHeader from '@/components/navigation/CustomHeader'
import { router, Stack } from 'expo-router'
import React from 'react'
import { useColorScheme } from 'react-native'

export default function SystemAdminLayout() {
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
			{/* Muscle Groups */}
			<Stack.Screen
				name="muscle-groups/create"
				options={
					{
						title: 'Create Muscle Group',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
						rightIcons: [
							{
								name: 'checkmark-done',
								disabled: true,
								color: 'green',
							},
						],
					} as any
				}
			/>
			<Stack.Screen
				name="muscle-groups/[id]"
				options={
					{
						title: 'Edit Muscle Group',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
						rightIcons: [
							{
								name: 'checkmark-done',
								disabled: true,
								color: 'green',
							},
						],
					} as any
				}
			/>

			{/* Equipment */}
			<Stack.Screen
				name="equipment/create"
				options={
					{
						title: 'Create Equipment',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
						rightIcons: [
							{
								name: 'checkmark-done',
								disabled: true,
								color: 'green',
							},
						],
					} as any
				}
			/>
			<Stack.Screen
				name="equipment/[id]"
				options={
					{
						title: 'Edit Equipment',
						leftIcon: 'chevron-back-outline',
						onLeftPress: () => {
							router.back()
						},
						rightIcons: [
							{
								name: 'checkmark-done',
								disabled: true,
								color: 'green',
							},
						],
					} as any
				}
			/>
		</Stack>
	)
}
