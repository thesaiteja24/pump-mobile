import ExerciseCharts from '@/components/exercises/ExerciseCharts'
import { CustomModal, ModalHandle } from '@/components/ui/CustomModal'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/stores/authStore'
import { useExercise } from '@/stores/exerciseStore'
import { convertWeight } from '@/utils/converter'
import { EvilIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useGlobalSearchParams } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useRef } from 'react'
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native'
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function ViewExerciseScreen() {
	const { id } = useGlobalSearchParams<{ id: string }>()
	const color = useThemeColor()

	const exerciseList = useExercise(s => s.exerciseList)
	const preferredWeightUnit = useAuth(s => s.user?.preferredWeightUnit) ?? 'kg'
	const { getExerciseAnalytics } = useAnalytics()
	const metrics = getExerciseAnalytics(id)

	const best1RMModalRef = useRef<ModalHandle>(null)
	const bestSetVolumeModalRef = useRef<ModalHandle>(null)
	const heaviestWeightModalRef = useRef<ModalHandle>(null)

	const isOpen = useSharedValue(0) // 1 = open, 0 = closed

	const exercise = exerciseList.find(e => e.id === id)
	const videoSource = exercise?.videoUrl ?? ''

	const player = useVideoPlayer({ uri: videoSource, useCaching: true }, player => {
		player.loop = true
		player.volume = 0
		player.audioMixingMode = 'mixWithOthers'
		player.play()
	})

	const toggleOpen = () => {
		isOpen.value = withTiming(isOpen.value ? 0 : 1, {
			duration: 250,
		})
	}

	const chevronStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					rotate: `${interpolate(isOpen.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg`,
				},
			],
		}
	})

	const recordsStyle = useAnimatedStyle(() => {
		return {
			opacity: isOpen.value,
			height: interpolate(
				isOpen.value,
				[0, 1],
				[0, 300], // adjust based on expected content
				Extrapolation.CLAMP
			),
			overflow: 'hidden',
		}
	})

	return (
		<View
			className="flex-1 items-center justify-center bg-white dark:bg-black"
			style={{ paddingBottom: useSafeAreaInsets().bottom }}
		>
			<ScrollView showsVerticalScrollIndicator={false}>
				<VideoView
					style={{
						width: width,
						height: 230,
						paddingTop: 0,
						marginTop: 0,
						backgroundColor: 'white',
					}}
					player={player}
					nativeControls={false}
				/>
				<Text className="self-start p-4 text-xl font-semibold text-black dark:text-white">
					{exercise?.title}
				</Text>

				<Text className="self-start px-4 pt-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">
					{`Primary: ${exercise?.primaryMuscleGroup.title}`}
				</Text>

				<Text className="self-start p-1 px-4 text-sm font-normal text-neutral-500 dark:text-neutral-400">
					{`Secondary: ${exercise?.otherMuscleGroups.length ? exercise.otherMuscleGroups.map(mg => mg.title).join(', ') : 'N/A'}`}
				</Text>

				<View className="flex flex-row justify-between px-4 pt-4">
					<View className="flex flex-row items-center gap-2">
						<Text className="text-lg font-normal text-black dark:text-white">Best 1RM</Text>
						<Pressable onPress={() => best1RMModalRef.current?.open()}>
							<EvilIcons name="question" size={16} color={color.icon} />
						</Pressable>
					</View>
					<Text className="text-lg font-normal text-blue-500">
						{convertWeight(metrics.best1RM, {
							from: preferredWeightUnit,
							to: 'kg',
						})}{' '}
						{preferredWeightUnit}s
					</Text>
				</View>

				<View className="flex flex-row justify-between px-4">
					<View className="flex flex-row items-center gap-2">
						<Text className="text-lg font-normal text-black dark:text-white">Best Set Volume</Text>
						<Pressable onPress={() => bestSetVolumeModalRef.current?.open()}>
							<EvilIcons name="question" size={16} color={color.icon} />
						</Pressable>
					</View>
					<Text className="text-lg font-normal text-blue-500">
						{convertWeight(metrics.bestSetVolume, {
							from: preferredWeightUnit,
							to: 'kg',
						})}{' '}
						{preferredWeightUnit}s
					</Text>
				</View>

				<View className="flex flex-row justify-between px-4">
					<View className="flex flex-row items-center gap-2">
						<Text className="text-lg font-normal text-black dark:text-white">Heaviest Weight</Text>
						<Pressable onPress={() => heaviestWeightModalRef.current?.open()}>
							<EvilIcons name="question" size={16} color={color.icon} />
						</Pressable>
					</View>
					<Text className="text-lg font-normal text-blue-500">
						{convertWeight(metrics.heaviestWeight, {
							from: preferredWeightUnit,
							to: 'kg',
						})}{' '}
						{preferredWeightUnit}s
					</Text>
				</View>

				<ExerciseCharts
					best1RMRecords={metrics.best1RMRecords}
					bestSetVolumeRecords={metrics.bestSetVolumeRecords}
					heaviestWeightRecords={metrics.heaviestWeightRecords}
				/>

				<Text className="px-4 pt-4 text-justify text-sm font-normal text-neutral-500 dark:text-neutral-400">
					Set Records track your strongest performance at each rep range. Beat a previous weight at the same
					reps and your record updates automatically.
				</Text>

				<Pressable onPress={toggleOpen} className="flex flex-row items-center justify-between px-4 pt-4">
					<Text className="text-lg font-semibold text-black dark:text-white">Set Records</Text>

					<Animated.View style={chevronStyle}>
						<MaterialCommunityIcons name="chevron-down" size={24} color={color.icon} />
					</Animated.View>
				</Pressable>

				<Animated.View style={recordsStyle}>
					<View className="flex flex-row gap-4 px-4 pt-4">
						<Text className="w-16 text-lg font-normal text-black dark:text-white">Reps</Text>
						<Text className="w-32 text-lg font-normal text-black dark:text-white">Personal Best</Text>
					</View>

					{Object.entries(metrics.setRecords).map(([reps, weight]) => (
						<View className="flex flex-col gap-4 px-4 pt-4" key={reps}>
							<View className="flex flex-row gap-4">
								<Text className="w-16 text-center text-lg font-normal text-black dark:text-white">
									{reps}
								</Text>
								<Text className="w-32 text-center text-lg font-normal text-black dark:text-white">
									{convertWeight(weight, {
										from: preferredWeightUnit,
										to: 'kg',
									})}{' '}
									{preferredWeightUnit}s
								</Text>
							</View>
							<View className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
						</View>
					))}
				</Animated.View>
			</ScrollView>
			{/* Best 1RM Info Modal */}
			<CustomModal
				ref={best1RMModalRef}
				title="Best 1RM"
				description="Best 1RM is the heaviest weight you can lift for a single repetition. It is calculated from your personal records and estimated for your maximum strength."
				confirmText="OK"
				onConfirm={() => {}}
				cancelText=""
			/>

			{/* Best Set Volume Info Modal */}
			<CustomModal
				ref={bestSetVolumeModalRef}
				title="Best Set Volume"
				description="Best Set Volume is the highest total volume you have lifted in a single set. It helps track your most productive sets."
				confirmText="OK"
				onConfirm={() => {}}
				cancelText=""
			/>

			{/* Heaviest Weight Info Modal */}
			<CustomModal
				ref={heaviestWeightModalRef}
				title="Heaviest Weight"
				description="Heaviest Weight records the maximum weight you have successfully lifted for any set. It helps track your top performance for each exercise."
				confirmText="OK"
				onConfirm={() => {}}
				cancelText=""
			/>
		</View>
	)
}
