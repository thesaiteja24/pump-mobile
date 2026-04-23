import { Button } from '@/components/ui/Button'
import { PaywallModal, PaywallModalHandle } from '@/components/ui/PaywallModal'
import ProgramCard from '@/components/workout/ProgramCard'
import ProgramWorkoutPromptModal, { ProgramWorkoutPromptHandle } from '@/components/workout/ProgramWorkoutPromptModal'
import { SkeletonProgramCard, SkeletonUserProgramCard } from '@/components/workout/SkeletonProgramCard'
import SkeletonTemplateCard from '@/components/workout/SkeletonTemplateCard'
import TemplateCard from '@/components/workout/TemplateCard'
import UserProgramCard from '@/components/workout/UserProgramCard'
import { FREE_TIER_LIMITS } from '@/constants/limits'
import { ROLES } from '@/constants/roles'
import { useExercises } from '@/hooks/queries/useExercises'
import { useActiveProgram, usePrograms, useUserPrograms } from '@/hooks/queries/usePrograms'
import { useTemplatesQuery } from '@/hooks/queries/useTemplates'
import { useUserQuery } from '@/hooks/queries/useUser'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { SelfUser } from '@/types/user'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useWorkout } from '@/stores/workoutStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
	BackHandler,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'

export default function WorkoutScreen() {
	const colors = useThemeColor()
	const { width } = useWindowDimensions()
	const [activeIndex, setActiveIndex] = useState(0)
	const [activeProgramIndex, setActiveProgramIndex] = useState(0)

	// Workout Store
	const workout = useWorkout(s => s.workout)
	const discardWorkout = useWorkout(s => s.discardWorkout)
	const startWorkout = useWorkout(s => s.startWorkout)
	const loadProgramDay = useWorkout(s => s.loadProgramDay)
	const currentUserId = useAuth(s => s.userId)
	const { data: userData } = useUserQuery(currentUserId!)
	const user = userData as SelfUser | null
	const userRole = user?.role

	// Template Store — draft/write actions only
	// Templates list and loading state come from TanStack Query
	const { data: templates = [], isLoading: templateLoading, refetch: refetchTemplates } = useTemplatesQuery()

	// Programs from TanStack Query
	const { data: programsData, isLoading: programLoading, refetch: refetchPrograms } = usePrograms()
	const programs = programsData?.programs || []
	const { data: activeProgram, isLoading: activeLoading, refetch: refetchActive } = useActiveProgram()
	const { data: allUserPrograms = [], isLoading: userProgramsLoading } = useUserPrograms()

	// Warm up exercise cache
	const { refetch: refetchExercises } = useExercises()

	const pastPrograms = allUserPrograms.filter(p => p.id !== activeProgram?.id)

	const [refreshing, setRefreshing] = useState(false)

	// Subscription Store
	const isPro = useSubscriptionStore(s => s.isPro)

	// Refs
	const paywallModalRef = useRef<PaywallModalHandle>(null)
	const programPromptRef = useRef<ProgramWorkoutPromptHandle>(null)

	// Animation values initialized at 0 opacity
	const activeWorkoutOpacity = useSharedValue(0)
	const activeWorkoutTranslateY = useSharedValue(20)

	const libraryOpacity = useSharedValue(0)
	const libraryTranslateY = useSharedValue(20)

	const templatesOpacity = useSharedValue(0)
	const templatesTranslateY = useSharedValue(20)

	const programsOpacity = useSharedValue(0)
	const programsTranslateY = useSharedValue(20)

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

		programsOpacity.value = withDelay(250, withTiming(1, { duration: 500 }))
		programsTranslateY.value = withDelay(250, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))
	}, [
		activeWorkoutOpacity,
		activeWorkoutTranslateY,
		libraryOpacity,
		libraryTranslateY,
		templatesOpacity,
		templatesTranslateY,
		programsOpacity,
		programsTranslateY,
	])

	const onRefresh = React.useCallback(async () => {
		setRefreshing(true)
		await Promise.all([refetchTemplates(), refetchPrograms(), refetchActive(), refetchExercises()])
		setRefreshing(false)
	}, [refetchTemplates, refetchPrograms, refetchActive, refetchExercises])

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

	const programsStyle = useAnimatedStyle(() => ({
		opacity: programsOpacity.value,
		transform: [{ translateY: programsOpacity.value === 1 ? 0 : programsTranslateY.value }],
	}))

	useEffect(() => {
		const onBackPress = () => {
			if (router.canGoBack()) {
				router.back()
			} else {
				router.push('/(app)/(tabs)/workout')
			}
			return true
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

		return () => subscription.remove()
	}, [])

	return (
		<ScrollView
			className="flex-1 bg-white p-4 dark:bg-black"
			showsVerticalScrollIndicator={false}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
		>
			<View className="mb-[50%]">
				{/* Active Workout Control */}
				<Animated.View style={activeWorkoutStyle} className="mb-4 flex flex-row gap-4">
					<Button
						title={workout ? 'Continue the Pump' : 'Ready to Get Pumped?'}
						variant="primary"
						onPress={() => {
							if (workout) {
								router.push('/(app)/workout/start')
								return
							}

							// Check if there is an active program with a scheduled workout for today
							if (activeProgram?.progress && !activeProgram.progress.isRestDay) {
								programPromptRef.current?.present()
							} else {
								startWorkout()
								router.push('/(app)/workout/start')
							}
						}}
						className="flex-1"
					/>
					{workout && (
						<Button title="Discard" variant="danger" onPress={discardWorkout} className="max-w-[35%]" />
					)}
				</Animated.View>

				<Animated.View style={libraryStyle}>
					<View className="flex flex-row gap-4">
						<Button
							title="View Library"
							variant="secondary"
							onPress={() => router.push('/(app)/exercises')}
							className="mb-6 flex-1"
						/>
						<Button
							title="View History"
							variant="secondary"
							onPress={() => router.push('/(app)/workout/history')}
							className="mb-6 flex-1"
						/>
					</View>
				</Animated.View>

				<Animated.View style={programsStyle} className="mb-8 flex flex-col gap-4">
					<View className="flex flex-row items-center justify-between">
						<Text className="text-xl font-semibold text-black dark:text-white">Active Program</Text>
					</View>

					{/* Active Program Card or Dotted Interface */}
					<View className="">
						{activeLoading || refreshing ? (
							<SkeletonUserProgramCard />
						) : activeProgram ? (
							<UserProgramCard program={activeProgram} />
						) : (
							<View className="h-44 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
								<Text className="mb-2 text-neutral-500 dark:text-neutral-400">
									No active program. Choose one below!
								</Text>
							</View>
						)}
					</View>
				</Animated.View>

				{/* Programs Section */}
				<Animated.View style={programsStyle} className="mb-8 flex flex-col gap-4">
					<View className="flex flex-row items-center justify-between">
						<Text className="text-xl font-semibold text-black dark:text-white">Programs</Text>

						{isPro && userRole === ROLES.systemAdmin && (
							<TouchableOpacity
								onPress={() => {
									router.push('/(app)/program')
								}}
							>
								<MaterialCommunityIcons name="folder-plus" size={24} color={colors.icon} />
							</TouchableOpacity>
						)}
					</View>

					{/* Available Programs Carousel */}
					{programLoading || refreshing ? (
						<View>
							<Carousel
								loop={false}
								width={width}
								height={160}
								autoPlay={false}
								data={[1, 2]}
								scrollAnimationDuration={700}
								enabled={false}
								renderItem={() => <SkeletonProgramCard />}
								mode="parallax"
								modeConfig={{
									parallaxAdjacentItemScale: 0.9,
									parallaxScrollingScale: 1,
									parallaxScrollingOffset: 160,
								}}
							/>
							<View className="flex-row justify-center gap-2">
								<View className="h-2 w-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
								<View className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
							</View>
						</View>
					) : programs.length === 0 ? (
						<View className="h-40 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
							<Text className="text-neutral-500 dark:text-neutral-400">
								No programs available. Create one!
							</Text>
						</View>
					) : (
						<View>
							<Carousel
								loop={false}
								width={width}
								height={160}
								autoPlay={false}
								data={programs}
								scrollAnimationDuration={700}
								onSnapToItem={index => setActiveProgramIndex(index)}
								renderItem={({ item }) => <ProgramCard program={item} />}
								mode="parallax"
								modeConfig={{
									parallaxAdjacentItemScale: 0.9,
									parallaxScrollingScale: 1,
									parallaxScrollingOffset: 160,
								}}
							/>

							<View className="flex-row justify-center gap-2">
								{programs.map((_, index) => (
									<View
										key={index}
										className={`h-2 w-2 rounded-full ${
											index === activeProgramIndex
												? 'w-6 bg-blue-600'
												: 'bg-neutral-300 dark:bg-neutral-700'
										}`}
									/>
								))}
							</View>
						</View>
					)}
				</Animated.View>

				{/* Templates Section */}
				<Animated.View style={templatesStyle} className="flex flex-col gap-4">
					<View className="flex flex-row items-center justify-between">
						<Text className="text-xl font-semibold text-black dark:text-white">My Templates</Text>

						<TouchableOpacity
							onPress={() => {
								if (!isPro && templates.length >= FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES) {
									paywallModalRef.current?.present()
								} else {
									router.push('/(app)/template/editor')
								}
							}}
						>
							<MaterialCommunityIcons name="folder-plus" size={24} color={colors.icon} />
						</TouchableOpacity>
					</View>

					{templateLoading || refreshing ? (
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
						<View className="h-40 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
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

				{/* Past Programs Section */}
				{pastPrograms.length > 0 && (
					<Animated.View style={programsStyle} className="mt-8 flex flex-col gap-4">
						<View className="flex flex-row items-center justify-between">
							<Text className="text-xl font-semibold text-black dark:text-white">Past Programs</Text>
						</View>

						{userProgramsLoading || refreshing ? (
							<SkeletonUserProgramCard />
						) : (
							<View className="gap-4">
								{pastPrograms.map(p => (
									<UserProgramCard key={p.id} program={p} />
								))}
							</View>
						)}
					</Animated.View>
				)}
			</View>

			<ProgramWorkoutPromptModal
				ref={programPromptRef}
				programTitle={activeProgram?.program?.title || 'Active Program'}
				workoutTitle={activeProgram?.progress?.workoutTitle || 'Scheduled Workout'}
				onSelectProgram={() => {
					if (activeProgram?.progress?.userProgramDayId && activeProgram?.progress?.templateSnapshot) {
						loadProgramDay(activeProgram.progress.userProgramDayId, activeProgram.progress.templateSnapshot)
						router.push('/(app)/workout/start')
					} else {
						startWorkout()
						router.push('/(app)/workout/start')
					}
				}}
				onSelectEmpty={() => {
					startWorkout()
					router.push('/(app)/workout/start')
				}}
			/>

			<PaywallModal
				ref={paywallModalRef}
				title="Upgrade to Pro"
				description={`You can only add up to ${FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES} custom templates on the Free plan. Upgrade to create UNLIMITED Templates`}
				continueText="View Plans"
			/>
		</ScrollView>
	)
}
