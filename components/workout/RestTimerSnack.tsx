import { formatSeconds } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
	visible: boolean
	startedAt: number | null
	targetSeconds: number
	onAddTime: (delta: number) => void
	onSkip: () => void
	onComplete?: () => void
}

export default function RestTimerSnack({ visible, startedAt, targetSeconds, onAddTime, onSkip, onComplete }: Props) {
	const isDark = useColorScheme() === 'dark'
	const safeAreaInsets = useSafeAreaInsets()
	const [now, setNow] = useState(Date.now())

	/* 
     Update "now" every second while visible.
  */
	useEffect(() => {
		if (!visible) return

		setNow(Date.now()) // sync immediately on mount
		const id = setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => clearInterval(id)
	}, [visible])

	/*
    Calculate remaining time.
  */
	const elapsed = visible && startedAt ? Math.floor((now - startedAt) / 1000) : 0
	const remainingSeconds = Math.max(0, targetSeconds - elapsed)

	/*
    Notify parent on completion (just once).
  */
	useEffect(() => {
		if (visible && remainingSeconds === 0) {
			onComplete?.()
		}
	}, [visible, remainingSeconds, onComplete])

	if (!visible) return null

	return (
		<View
			className="absolute bottom-0 left-0 right-0 mx-4 mb-4 rounded-2xl border border-neutral-200 bg-white px-4 py-2 shadow-lg dark:border-neutral-800 dark:bg-black"
			style={{ marginBottom: safeAreaInsets.bottom }}
		>
			<View className="flex-row items-center justify-between">
				<Text className="text-xl font-bold text-black dark:text-white">{formatSeconds(remainingSeconds)}</Text>

				<TouchableOpacity
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
						onAddTime(-10)
					}}
					className="rounded-full bg-neutral-100 px-3 py-2 dark:bg-neutral-900"
				>
					<Text className="text-lg font-semibold text-black dark:text-white">−10</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
						onAddTime(10)
					}}
					className="rounded-full bg-neutral-100 px-3 py-2 dark:bg-neutral-900"
				>
					<Text className="text-lg font-semibold text-black dark:text-white">+10</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
						onSkip()
					}}
					className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-900"
				>
					<Ionicons name="play-skip-forward" size={24} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			</View>
		</View>
	)
}
