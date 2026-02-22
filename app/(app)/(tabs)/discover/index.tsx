import ShimmerDiscoverScreen from '@/components/discover/ShimmerDiscoverScreen'
import WorkoutCard from '@/components/home/WorkoutCard'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useExercise } from '@/stores/exerciseStore'
import { useWorkout } from '@/stores/workoutStore'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function DiscoverScreen() {
	const colors = useThemeColor()

	// ───────────────── Stores ─────────────────
	const discoverWorkouts = useWorkout(s => s.discoverWorkouts)
	const discoverLoading = useWorkout(s => s.discoverLoading)
	const getDiscoverWorkouts = useWorkout(s => s.getDiscoverWorkouts)

	const exerciseList = useExercise(s => s.exerciseList)
	const getAllExercises = useExercise(s => s.getAllExercises)

	const [refreshing, setRefreshing] = useState(false)

	// ───────────────── Derived data ─────────────────
	const exerciseTypeMap = useMemo(() => {
		const map = new Map<string, any>()
		exerciseList.forEach(ex => map.set(ex.id, ex.exerciseType))
		return map
	}, [exerciseList])

	// ───────────────── Refresh ─────────────────
	const onRefresh = useCallback(async () => {
		try {
			setRefreshing(true)
			await Promise.all([getDiscoverWorkouts(), getAllExercises()])
		} finally {
			setRefreshing(false)
		}
	}, [getDiscoverWorkouts, getAllExercises])

	// ───────────────── Initial Load ─────────────────
	useEffect(() => {
		Promise.all([getDiscoverWorkouts(), getAllExercises()])
	}, [])

	// ───────────────── Header animation ─────────────────
	const headerOpacity = useSharedValue(0)
	const headerTranslateY = useSharedValue(-20)

	useEffect(() => {
		headerOpacity.value = withTiming(1, { duration: 600 })
		headerTranslateY.value = withTiming(0, {
			duration: 600,
			easing: Easing.out(Easing.quad),
		})
	}, [])

	const headerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: headerOpacity.value,
		transform: [{ translateY: headerTranslateY.value }],
	}))

	// ───────────────── Render ─────────────────
	return (
		<SafeAreaView className="flex-1 bg-white px-4 pt-4 dark:bg-black" edges={['top']}>
			{/* Header */}
			<Animated.View style={headerAnimatedStyle} className="mb-4 flex-row items-center justify-between">
				<Text numberOfLines={1} className="text-2xl font-semibold text-black dark:text-white">
					Discover
				</Text>

				<Pressable
					onPress={() => {
						router.push('/(app)/profile/search')
					}}
				>
					<MaterialCommunityIcons name="magnify" size={24} color={colors.isDark ? 'white' : 'black'} />
				</Pressable>
			</Animated.View>

			{/* Workout List */}
			{discoverLoading || refreshing ? (
				<ShimmerDiscoverScreen />
			) : (
				<FlatList
					data={discoverWorkouts}
					keyExtractor={item => item.clientId}
					renderItem={({ item, index }) => (
						<WorkoutCard
							workout={item}
							exerciseTypeMap={exerciseTypeMap}
							index={index}
							showSyncStatus={false}
						/>
					)}
					showsVerticalScrollIndicator={false}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					ListEmptyComponent={
						<View className="mt-10 items-center">
							<Text className="text-neutral-500 dark:text-neutral-400">No workouts yet.</Text>
						</View>
					}
					ListFooterComponent={<View className="mb-[20%]" />}
				/>
			)}
		</SafeAreaView>
	)
}
