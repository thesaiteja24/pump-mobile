import CustomHeader from '@/components/navigation/CustomHeader'
import { router, Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

export default function ExerciseDetailsStack() {
	const scheme = useColorScheme()

	return (
		<Stack
			screenOptions={{
				contentStyle: {
					backgroundColor: scheme === 'dark' ? '#000' : '#fff',
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
				name="(tabs)"
				options={
					{
						title: 'Exercise',
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
