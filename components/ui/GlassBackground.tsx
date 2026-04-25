import { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet'
import { BlurView } from 'expo-blur'
import React, { useMemo } from 'react'
import { StyleSheet, View, useColorScheme } from 'react-native'

export const GlassBackground: React.FC<BottomSheetBackgroundProps> = ({ style, animatedIndex }) => {
  const isDark = useColorScheme() === 'dark'

  const containerStyle = useMemo(
    () => [
      style,
      {
        overflow: 'hidden' as const,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
      },
    ],
    [style, isDark],
  )

  return (
    <View style={containerStyle} pointerEvents="none">
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle overlay to control translucency */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            // backgroundColor: isDark ? 'rgba(23, 23, 23, 0.4)' : 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      />
    </View>
  )
}
