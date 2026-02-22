import { useThemeColor } from '@/hooks/useThemeColor'
import { useSyncStore } from '@/stores/syncStore'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Text, View } from 'react-native'

export default function SyncStatus() {
	const { isOnline, isSyncing, pendingCount, failedCount } = useSyncStore()
	const spinValue = useRef(new Animated.Value(0)).current
	const colors = useThemeColor()

	useEffect(() => {
		if (isSyncing) {
			Animated.loop(
				Animated.timing(spinValue, {
					toValue: 1,
					duration: 1000,
					easing: Easing.linear,
					useNativeDriver: true,
				})
			).start()
		} else {
			spinValue.setValue(0)
			spinValue.stopAnimation()
		}
	}, [isSyncing, spinValue])

	const spin = spinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	})

	// 1. Offline & Pending Changes -> Orange Cloud/Exclamation
	if (!isOnline && pendingCount > 0) {
		return (
			<View className="mr-2 flex-row items-center space-x-1 rounded-full bg-orange-100 px-2 py-1 dark:bg-orange-900">
				<Ionicons name="cloud-offline" size={16} color={colors.warning} />
				<Text className="text-xs font-medium text-orange-600 dark:text-orange-300">{pendingCount}</Text>
			</View>
		)
	}

	// 2. Failed Items -> Red Warning
	// if (failedCount > 0) {
	//   return (
	//     <View className="mr-2 flex-row items-center space-x-1 rounded-full bg-red-100 px-2 py-1 dark:bg-red-900">
	//       <Ionicons name="alert-circle" size={16} color={colors.danger} />
	//       <Text className="text-xs font-medium text-red-600 dark:text-red-300">
	//         {failedCount}
	//       </Text>
	//     </View>
	//   );
	// }

	// 3. Syncing -> Spinning Arrows
	if (isSyncing) {
		return (
			<View className="mr-2">
				<Animated.View style={{ transform: [{ rotate: spin }] }}>
					<Ionicons name="sync" size={18} color={colors.primary} />
				</Animated.View>
			</View>
		)
	}

	// 4. Online & All Synced -> Green Check (briefly? or just hidden?)
	// Usually hidden is better to reduce clutter, or a subtle cloud-done
	if (isOnline && pendingCount === 0) {
		// Optional: Show nothing if everything is good
		return null
		// Or subtle check:
		// return (
		//   <Ionicons name="cloud-done-outline" size={18} color={colors.success} style={{ marginRight: 8 }} />
		// );
	}

	// 5. Offline but no pending changes -> Offline icon
	if (!isOnline) {
		return (
			<View className="mr-2">
				<Ionicons name="cloud-offline-outline" size={18} color={colors.text} />
			</View>
		)
	}

	return null
}
