import {
	createMaterialTopTabNavigator,
	MaterialTopTabNavigationEventMap,
	MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs'
import { ParamListBase, TabNavigationState } from '@react-navigation/native'
import { withLayoutContext } from 'expo-router'

const { Navigator } = createMaterialTopTabNavigator()

export const MaterialTopTabs = withLayoutContext<
	MaterialTopTabNavigationOptions,
	typeof Navigator,
	TabNavigationState<ParamListBase>,
	MaterialTopTabNavigationEventMap
>(Navigator)

export default function ExerciseDetailsLayout() {
	return (
		<MaterialTopTabs
			screenOptions={{
				tabBarActiveTintColor: '#3b82f6', // blue-500
				tabBarInactiveTintColor: '#9ca3af', // neutral-400

				// Use the indicator as the active background
				tabBarIndicatorStyle: {
					backgroundColor: '#3b82f6', // blue-50
					height: 4,
				},

				tabBarLabelStyle: {
					fontWeight: '600',
					textTransform: 'none',
					zIndex: 1,
				},

				tabBarStyle: {
					backgroundColor: 'transparent',
					elevation: 0, // Android
					shadowOpacity: 0, // iOS
				},
			}}
		>
			<MaterialTopTabs.Screen
				name="summary"
				options={{
					title: 'Summary',
				}}
			/>
			<MaterialTopTabs.Screen
				name="guide"
				options={{
					title: 'Guide',
				}}
			/>
		</MaterialTopTabs>
	)
}
