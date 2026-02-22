import { Button } from '@/components/ui/Button'
import SkeletonTemplateCard from '@/components/workout/SkeletonTemplateCard'
import TemplateCard from '@/components/workout/TemplateCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useTemplate } from '@/stores/templateStore'
import { useWorkout } from '@/stores/workoutStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function WorkoutScreen() {
	const colors = useThemeColor()
	const { width } = useWindowDimensions()
	const [activeIndex, setActiveIndex] = useState(0)

	// Workout Store
	const workout = useWorkout(s => s.workout)
	const discardWorkout = useWorkout(s => s.discardWorkout)

	// Template Store
	const templates = useTemplate(s => s.templates)
	const templateLoading = useTemplate(s => s.templateLoading)
	const getAllTemplates = useTemplate(s => s.getAllTemplates)

	// Animation values initialized at 0 opacity
	const activeWorkoutOpacity = useSharedValue(0)
	const activeWorkoutTranslateY = useSharedValue(20)

	const libraryOpacity = useSharedValue(0)
	const libraryTranslateY = useSharedValue(20)

	const templatesOpacity = useSharedValue(0)
	const templatesTranslateY = useSharedValue(20)

	useEffect(() => {
		// Staggered sequence
		activeWorkoutOpacity.value = withTiming(1, { duration: 500 })
		activeWorkoutTranslateY.value = withTiming(0, {
			duration: 500,
			easing: Easing.out(Easing.quad),
		})

		libraryOpacity.value = withDelay(100, withTiming(1, { duration: 500 }))
		libraryTranslateY.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))

		templatesOpacity.value = withDelay(200, withTiming(1, { duration: 500 }))
		templatesTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))
	}, [])

	useEffect(() => {
		getAllTemplates()
	}, [])

	const activeWorkoutStyle = useAnimatedStyle(() => ({
		opacity: activeWorkoutOpacity.value,
		transform: [{ translateY: activeWorkoutTranslateY.value }],
	}))

	const libraryStyle = useAnimatedStyle(() => ({
		opacity: libraryOpacity.value,
		transform: [{ translateY: libraryTranslateY.value }],
	}))

	const templatesStyle = useAnimatedStyle(() => ({
		opacity: templatesOpacity.value,
		transform: [{ translateY: templatesTranslateY.value }],
	}))

	return (
		<View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: useSafeAreaInsets().bottom }}>
			<View>
				{/* Active Workout Control */}
				<Animated.View style={activeWorkoutStyle} className="mb-4 flex flex-row gap-4">
					<Button
						title={workout ? 'Continue the Pump' : 'Ready to Get Pumped?'}
						variant="primary"
						onPress={() => router.push('/(app)/workout/start')}
						className="flex-1"
					/>
					{workout && (
						<Button title="Discard" variant="danger" onPress={discardWorkout} className="max-w-[35%]" />
					)}
				</Animated.View>

				<Animated.View style={libraryStyle}>
					<Button
						title="View Exercise Library"
						variant="secondary"
						onPress={() => router.push('/(app)/exercises')}
						className="mb-6"
					/>
				</Animated.View>

				{/* Templates Section */}
				<Animated.View style={templatesStyle} className="flex flex-col gap-4">
					<View className="flex flex-row items-center justify-between">
						<Text className="text-xl font-semibold text-black dark:text-white">My Templates</Text>

						<TouchableOpacity onPress={() => router.push('/(app)/template/editor')}>
							<MaterialCommunityIcons name="folder-plus" size={24} color={colors.icon} />
						</TouchableOpacity>
					</View>

					{templateLoading ? (
						<View>
							<Carousel
								loop={false}
								width={width}
								height={160}
								autoPlay={false}
								data={[1, 2]} // two skeleton cards
								scrollAnimationDuration={700}
								enabled={false}
								renderItem={() => <SkeletonTemplateCard />}
								mode="parallax"
								modeConfig={{
									parallaxAdjacentItemScale: 0.9,
									parallaxScrollingScale: 1,
									parallaxScrollingOffset: 160,
								}}
							/>

							{/* fake pagination */}
							<View className="flex-row justify-center gap-2">
								<View className="h-2 w-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
								<View className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
							</View>
						</View>
					) : templates.length === 0 ? (
						<View className="mb-4 h-32 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
							<Text className="text-neutral-500 dark:text-neutral-400">
								No templates yet. Create one!
							</Text>
						</View>
					) : (
						<View>
							<Carousel
								loop={false}
								width={width}
								height={160}
								autoPlay={false}
								data={templates}
								scrollAnimationDuration={700}
								onSnapToItem={index => setActiveIndex(index)}
								renderItem={({ item }) => <TemplateCard template={item} />}
								mode="parallax"
								modeConfig={{
									parallaxAdjacentItemScale: 0.9,
									parallaxScrollingScale: 1,
									parallaxScrollingOffset: 160,
								}}
							/>
							{/* Pagination Dots */}
							<View className="flex-row justify-center gap-2">
								{templates.map((_, index) => (
									<View
										key={index}
										className={`h-2 w-2 rounded-full ${
											index === activeIndex
												? 'w-6 bg-blue-600'
												: 'bg-neutral-300 dark:bg-neutral-700'
										}`}
									/>
								))}
							</View>
						</View>
					)}
				</Animated.View>
			</View>
		</View>
	)
}
