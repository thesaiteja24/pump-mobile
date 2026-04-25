import { BlurView } from 'expo-blur'
import React from 'react'
import { StyleSheet, View, ViewProps, useColorScheme } from 'react-native'

interface GlassViewProps extends ViewProps {
  children?: React.ReactNode
  darkIntensity?: number
  lightIntensity?: number
}

/**
 * A reusable glass wrapper for standard View components.
 * Used primarily for wrapping content in standard React Native Modals
 * to match the look of the BottomSheet GlassBackground.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  darkIntensity = 20,
  lightIntensity = 50,
  ...props
}) => {
  const isDark = useColorScheme() === 'dark'

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
        },
        style,
      ]}
      {...props}
    >
      <BlurView
        // intensity={isDark ? darkIntensity : lightIntensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle overlay to control translucency */}
      <View
        renderToHardwareTextureAndroid
        style={[
          StyleSheet.absoluteFill,
          {
            // backgroundColor: isDark ? 'rgba(23, 23, 23, 0.4)' : 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      />
      {children}
    </View>
  )
}
