import ShimmerDiscoverScreen from '@/components/discover/ShimmerDiscoverScreen'
import WorkoutCard from '@/components/home/WorkoutCard'
import { useExercises } from '@/hooks/queries/useExercises'
import { useDiscoverWorkoutsQuery } from '@/hooks/queries/useWorkoutHistory'
import { useThemeColor } from '@/hooks/useThemeColor'

import { queryKeys } from '@/lib/queryKeys'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function DiscoverScreen() {
	const colors = useThemeColor()

	// TanStack Query — infinite pagination with pending merge
	const {
		discoverWorkouts,
		hasMore: discoverHasMore,
		isLoading: discoverLoading,
		isFetchingNextPage: discoverLoadingNextPage,
		fetchNextPage,
		refetch: refetchDiscover,
	} = useDiscoverWorkoutsQuery()

	const qc = useQueryClient()

	const { data: exerciseList = [] } = useExercises()

	const [refreshing, setRefreshing] = useState(false)

	// ───────────────── Derived data ─────────────────
	const exerciseTypeMap = useMemo(() => {
		const map = new Map<string, any>()
		exerciseList.forEach(ex => map.set(ex.id, ex.exerciseType))
		return map
	}, [exerciseList])

	const onRefresh = useCallback(async () => {
		setRefreshing(true)
		// resetQueries will clear the cache and refetch ONLY the first page
		await qc.resetQueries({ queryKey: queryKeys.workouts.discover })
		setRefreshing(false)
	}, [qc])

	const onEndReached = useCallback(() => {
		if (!discoverLoading && discoverHasMore) {
			fetchNextPage()
		}
	}, [discoverLoading, discoverHasMore, fetchNextPage])

	// ───────────────── Header animation ─────────────────
	const headerOpacity = useSharedValue(0)
	const headerTranslateY = useSharedValue(-20)

	useEffect(() => {
		headerOpacity.value = withTiming(1, { duration: 600 })
		headerTranslateY.value = withTiming(0, {
			duration: 600,
			easing: Easing.out(Easing.exp),
		})
	}, [headerOpacity, headerTranslateY])

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
			{refreshing || discoverLoading ? (
				<ShimmerDiscoverScreen />
			) : (
				<FlatList
					data={discoverWorkouts}
					keyExtractor={item => item.id}
					renderItem={({ item, index }) => (
						<WorkoutCard workout={item} exerciseTypeMap={exerciseTypeMap} index={index} />
					)}
					showsVerticalScrollIndicator={false}
					refreshControl={<RefreshControl refreshing={discoverLoading} onRefresh={onRefresh} />}
					onEndReached={onEndReached}
					onEndReachedThreshold={0.1}
					ListEmptyComponent={
						<View className="mt-10 items-center">
							<Text className="text-neutral-500 dark:text-neutral-400">No workouts yet.</Text>
						</View>
					}
					ListFooterComponent={
						discoverHasMore ? (
							<View className="mb-[20%] items-center justify-center p-4 pb-12 pt-6">
								{discoverLoadingNextPage && <ActivityIndicator size="small" color={colors.primary} />}
							</View>
						) : (
							<View className="mb-[20%] items-center justify-center p-4 pb-12 pt-6">
								<Text className="text-neutral-500 dark:text-neutral-400">
									You&apos;ve conquered all the workouts here 🏆
								</Text>
							</View>
						)
					}
				/>
			)}
		</SafeAreaView>
	)
}
