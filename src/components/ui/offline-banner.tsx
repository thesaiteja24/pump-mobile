import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

/**
 * Displays a non-intrusive banner at the top of the screen when the device
 * is offline. Uses @react-native-community/netinfo for real-time connectivity.
 */
export function OfflineBanner() {
  const { colors, typography, spacing } = useTheme()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected)
    })
    return unsubscribe
  }, [])

  if (!isOffline)
    return null

  return (
    <View
      style={{
        backgroundColor: colors.warning,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
      }}
    >
      <Text style={[typography.bodySmStrong, { color: colors.black }]}>
        No internet connection
      </Text>
    </View>
  )
}
