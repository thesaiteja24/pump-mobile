import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'
import { type NetworkStatus } from '@/types/network'

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus(): NetworkStatus {
	const [status, setStatus] = useState<NetworkStatus>({
		isConnected: true,
		isInternetReachable: true,
	})

	useEffect(() => {
		// Get initial state
		NetInfo.fetch().then((state: NetInfoState) => {
			setStatus({
				isConnected: state.isConnected ?? false,
				isInternetReachable: state.isInternetReachable,
			})
		})

		// Subscribe to changes
		const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
			setStatus({
				isConnected: state.isConnected ?? false,
				isInternetReachable: state.isInternetReachable,
			})
		})

		return () => unsubscribe()
	}, [])

	return status
}

/**
 * Check network status synchronously (for non-hook contexts)
 */
export async function checkNetworkStatus(): Promise<NetworkStatus> {
	const state = await NetInfo.fetch()
	return {
		isConnected: state.isConnected ?? false,
		isInternetReachable: state.isInternetReachable,
	}
}
