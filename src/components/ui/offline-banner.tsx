import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

import type { StyleProp, ViewStyle } from 'react-native'

/**
 * Displays a non-intrusive banner at the top of the screen when the device
 * is offline. Uses @react-native-community/netinfo for real-time connectivity.
 */
export function OfflineBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colorModes, typography, spacing } = useTheme()
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
      style={[
        {
          backgroundColor: colorModes.foreground.warning,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={[typography.bodySmStrong, { color: colorModes.base.black }]}>
        No internet connection
      </Text>
    </View>
  )
}
