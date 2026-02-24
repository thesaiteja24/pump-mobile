import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useEngagementStore } from '@/stores/engagementStore'
import { ExerciseType } from '@/stores/exerciseStore'
import { WorkoutHistoryItem } from '@/stores/workoutStore'
import { formatDurationFromDates, formatTimeAgo } from '@/utils/time'
import { calculateWorkoutMetrics } from '@/utils/workout'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Alert, Pressable, Share, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import CommentsModal, { CommentsModalHandle } from '../discover/CommentsModal'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function WorkoutCard({
	workout,
	exerciseTypeMap,
	index = 0,
	showSyncStatus = true,
}: {
	workout: WorkoutHistoryItem
	exerciseTypeMap: Map<string, ExerciseType>
	index?: number
	showSyncStatus?: boolean
}) {
	const duration = formatDurationFromDates(workout.startTime, workout.endTime)
	const volume = calculateWorkoutMetrics(workout, exerciseTypeMap).tonnage
	const isDark = useThemeColor().isDark

	// Guard against missing exercises array
	const exercises = workout.exercises || []
	const previewExercises = exercises.slice(0, 3)
	const remaining = exercises.length - previewExercises.length

	const commentsModalRef = useRef<CommentsModalHandle>(null)

	const { user } = useAuth()
	const { workoutLikes, fetchWorkoutLikes, toggleWorkoutLike, fetchComments, comments } = useEngagementStore()

	const currentLikes = workoutLikes[workout.id] || []
	const isLikedByMe = user && currentLikes.some(like => like.userId === user.userId)

	const validComments = comments[workout.id]?.filter(c => c.user?.id) || []
	const recentComments = validComments.slice(0, 2)

	const handleToggleLike = () => {
		if (!user || !user.userId) return
		toggleWorkoutLike(workout.id, {
			id: user.userId,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			profilePicUrl: user.profilePicUrl || null,
		})
	}

	const handleShare = async () => {
		if (!workout.shareId) {
			Toast.show({
				type: 'error',
				text1: 'Error',
				text2: 'Workout cannot be shared ',
			})
			return
		}

		try {
			const webLink = `https://pump.thesaiteja.dev/share/workout/${workout.shareId}`
			await Share.share({
				message: `Check out my workout on Pump: ${webLink}`,
				url: webLink,
				title: workout.title || 'Workout',
			})
		} catch (error) {
			console.error('Error sharing workout:', error)
			Alert.alert('Error', 'Failed to share the workout.')
		}
	}

	useEffect(() => {
		fetchWorkoutLikes(workout.id)
		fetchComments(workout.id, true)
	}, [workout.id])

	// Animation values
	const opacity = useSharedValue(0)
	const translateY = useSharedValue(50)
	const scale = useSharedValue(1)

	useEffect(() => {
		const delay = index * 100 + 500
		opacity.value = withDelay(delay, withTiming(1, { duration: 500 }))
		translateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))
	}, [index])

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ scale: scale.value }, { translateY: translateY.value }],
	}))

	const onPressIn = () => {
		scale.value = withSpring(0.97, { damping: 10, stiffness: 300 })
	}

	const onPressOut = () => {
		scale.value = withSpring(1, { damping: 10, stiffness: 300 })
	}

	return (
		<AnimatedPressable
			style={animatedStyle}
			// onPressIn={onPressIn}
			// onPressOut={onPressOut}
			onPress={() => {
				router.push(`/(app)/workout/${workout.id}`)
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
			}}
			className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
		>
			{/* Profile Section */}
			<View className="mb-4 flex-row items-center justify-between gap-4">
				<View className="flex-row items-center gap-4">
					<Image
						source={
							workout?.user?.profilePicUrl
								? { uri: workout.user.profilePicUrl }
								: require('../../assets/images/icon.png')
						}
						style={{
							width: 48,
							height: 48,
							borderRadius: 100,
							borderColor: isDark ? 'white' : '#black',
							borderWidth: 0.25,
						}}
						contentFit="cover"
					/>

					<View className="flex-col items-start gap-1">
						<Text className="text-base text-black dark:text-white">
							{workout?.user?.firstName} {workout?.user?.lastName}
						</Text>
						<Text className="flex-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">
							{formatTimeAgo(new Date(workout.startTime))}
						</Text>
					</View>
				</View>
				{showSyncStatus && (
					<Text className="self-start rounded-full bg-blue-200 px-2 py-1 text-left text-xs font-normal text-blue-600">
						{workout.syncStatus}
					</Text>
				)}
			</View>
			{/* Header */}
			<View className="mb-4 flex-col justify-between gap-2">
				<View className="flex-row items-center justify-between gap-4">
					<Text className="line-clamp-1 text-lg font-medium text-black dark:text-white">
						{workout.title || 'Workout'}
					</Text>
				</View>

				<View className="flex-row items-center justify-between gap-4">
					<Text className="flex-1 text-sm font-normal text-primary">
						<Text className="text-sm font-medium text-black dark:text-white">Duration:</Text> {duration}
					</Text>

					<Text className="flex-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">
						Volume: {volume} kg
					</Text>
				</View>
			</View>

			{/* Exercise preview */}
			{previewExercises.map((ex: any) => (
				<View key={ex.id} className="mb-2 flex-row items-center gap-3">
					<Image
						cachePolicy="disk"
						source={ex.exercise.thumbnailUrl}
						style={{
							width: 44,
							height: 44,
							borderRadius: 999,
							borderColor: '#ccc',
							borderWidth: 1,
						}}
						contentFit="cover"
					/>

					<Text numberOfLines={1} className="flex-1 text-base font-medium text-black dark:text-white">
						{ex.sets.length} sets of {ex.exercise.title}
					</Text>
				</View>
			))}

			{remaining > 0 && (
				<Text className="mt-1 text-center text-sm text-primary">
					See {remaining} more exercise{remaining > 1 ? 's' : ''}
				</Text>
			)}

			{/* Social Interactions */}
			<View className="mt-4 flex-row items-center justify-start gap-4">
				<View className="flex flex-row items-center justify-center gap-2">
					<TouchableOpacity onPress={handleToggleLike}>
						<MaterialCommunityIcons
							name={isLikedByMe ? 'cards-heart' : 'heart-outline'}
							size={28}
							color={isLikedByMe ? '#F43F5E' : isDark ? 'white' : 'black'}
						/>
					</TouchableOpacity>
					<View>
						{(workout.likesCount || currentLikes.length) > 0 && (
							<Text className="text-base text-black dark:text-white">
								{Math.max(workout.likesCount || 0, currentLikes.length)}
							</Text>
						)}
					</View>
				</View>
				<View className="flex flex-row items-center justify-center gap-2">
					<TouchableOpacity onPress={() => commentsModalRef.current?.present()}>
						<Ionicons
							name="chatbubble-outline"
							size={26}
							color={isDark ? 'white' : 'black'}
							style={{ transform: [{ scaleX: -1 }] }}
						/>
					</TouchableOpacity>
					<View>
						{(workout.commentsCount || 0) > 0 && (
							<Text className="text-base text-black dark:text-white">{workout.commentsCount}</Text>
						)}
					</View>
				</View>
				<View>
					<TouchableOpacity onPress={handleShare}>
						<Ionicons name="share-outline" size={28} color={isDark ? 'white' : 'black'} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Liked By Section */}
			{currentLikes.length > 0 && (
				<View className="mt-3 flex-row items-center gap-2">
					<View className="flex-row">
						{currentLikes.slice(0, 3).map((like, i) => (
							<Image
								key={like.userId}
								source={
									like.user?.profilePicUrl
										? { uri: like.user.profilePicUrl }
										: require('../../assets/images/icon.png')
								}
								style={{
									width: 20,
									height: 20,
									borderRadius: 10,
									marginLeft: i > 0 ? -6 : 0,
									borderWidth: 1.5,
									borderColor: isDark ? '#171717' : 'white',
								}}
							/>
						))}
					</View>
					<Text className="text-sm text-black dark:text-white">
						Liked by{' '}
						<Text className="font-bold">
							{(currentLikes[0]?.user?.firstName || 'someone').toLowerCase()}
						</Text>{' '}
						{currentLikes.length > 1
							? `and ${currentLikes.length - 1} other${currentLikes.length > 2 ? 's' : ''}`
							: ''}
					</Text>
				</View>
			)}

			{/* Inline Comments Review */}
			{recentComments.length > 0 && (
				<Pressable
					className="mt-4 rounded-2xl bg-neutral-200 p-4 dark:bg-neutral-800"
					onPress={() => commentsModalRef.current?.present()}
				>
					{recentComments.length > 0 && (
						<View className="flex-col gap-2">
							{recentComments.map(c => (
								<View key={c.id} className="flex-row items-start gap-2 pr-4">
									<Text className="text-[14px] font-bold text-black dark:text-white">
										{c.user?.firstName || 'user'}
									</Text>
									<Text className="flex-1 text-[14px] text-black dark:text-white" numberOfLines={1}>
										{c.content}
									</Text>
								</View>
							))}
						</View>
					)}

					<View className="mt-3 flex-row items-center gap-2 rounded-full bg-neutral-300 p-2 dark:bg-neutral-700">
						<Image
							source={
								user?.profilePicUrl
									? { uri: user.profilePicUrl }
									: require('../../assets/images/icon.png')
							}
							style={{ width: 24, height: 24, borderRadius: 12 }}
						/>
						<Text className="text-[14px] text-neutral-500 dark:text-neutral-400">Add a comment...</Text>
					</View>
				</Pressable>
			)}

			<CommentsModal ref={commentsModalRef} workoutId={workout.id} />
		</AnimatedPressable>
	)
}
