import { useExercises } from '@/hooks/queries/exercises'
import { useThemeColor } from '@/hooks/theme'
import { useGlobalSearchParams } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Dimensions, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function GuideScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>()
  const { data: exerciseList = [] } = useExercises()
  const exercise = exerciseList.find((e) => e.id === id)
  const videoSource = exercise?.videoUrl ?? ''

  const player = useVideoPlayer({ uri: videoSource, useCaching: true }, (player) => {
    player.loop = true
    player.volume = 0
    player.audioMixingMode = 'mixWithOthers'
    player.play()
  })

  const colors = useThemeColor()
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{
        paddingBottom: insets.bottom,
        backgroundColor: colors.background,
      }}
    >
      <VideoView
        style={{
          width: width,
          height: 230,
          paddingTop: 0,
          marginTop: 0,
          backgroundColor: colors.background,
        }}
        player={player}
        nativeControls={false}
      />

      <Text className="self-start p-4 text-xl font-semibold text-black dark:text-white">
        {exercise?.title}
      </Text>

      <ScrollView>
        <Text className="p-4 text-base font-normal text-black dark:text-white">
          {exercise?.instructions}
        </Text>
      </ScrollView>
    </View>
  )
}
