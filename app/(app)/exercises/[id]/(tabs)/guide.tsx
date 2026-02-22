import { useExercise } from '@/stores/exerciseStore'
import { useGlobalSearchParams } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Dimensions, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function GuideScreen() {
	const { id } = useGlobalSearchParams<{ id: string }>()
	const exerciseList = useExercise(s => s.exerciseList)
	const exercise = exerciseList.find(e => e.id === id)
	const videoSource = exercise?.videoUrl ?? ''

	const player = useVideoPlayer({ uri: videoSource, useCaching: true }, player => {
		player.loop = true
		player.volume = 0
		player.audioMixingMode = 'mixWithOthers'
		player.play()
	})

	return (
		<View
			className="flex-1 items-center justify-center bg-white dark:bg-black"
			style={{ paddingBottom: useSafeAreaInsets().bottom }}
		>
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

			<Text className="self-start p-4 text-xl font-semibold text-black dark:text-white">{exercise?.title}</Text>

			<ScrollView>
				<Text className="p-4 text-base font-normal text-black dark:text-white">{exercise?.instructions}</Text>
			</ScrollView>
		</View>
	)
}
