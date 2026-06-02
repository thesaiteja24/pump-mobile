import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'

import { COLORS } from '@/config/tokens'

import { globalConfettiRef } from './confetti-ref'

const { width: screenWidth } = Dimensions.get('window')

const styles = StyleSheet.create({
  confettiFullScreenContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9998,
  },
})

function ConfettiRenderer({ activeKeys }: { activeKeys: string[] }) {
  const successColor = COLORS.dark.success
  const accentColor = COLORS.dark.accent
  const warningColor = COLORS.dark.warning

  return (
    <>
      {activeKeys.map(key => (
        <View key={key} style={styles.confettiFullScreenContainer} pointerEvents="none">
          <ConfettiCannon
            count={60}
            origin={{ x: screenWidth / 2, y: -20 }}
            autoStart
            fadeOut
            fallSpeed={2500}
            explosionSpeed={350}
            colors={[successColor, accentColor, warningColor, '#EC4899', '#8B5CF6']}
          />
          <ConfettiCannon
            count={60}
            origin={{ x: screenWidth / 2, y: -20 }}
            autoStart
            autoStartDelay={120}
            fadeOut
            fallSpeed={2700}
            explosionSpeed={350}
            colors={[successColor, accentColor, warningColor, '#EC4899', '#8B5CF6']}
          />
          <ConfettiCannon
            count={60}
            origin={{ x: screenWidth / 2, y: -20 }}
            autoStart
            autoStartDelay={240}
            fadeOut
            fallSpeed={2900}
            explosionSpeed={350}
            colors={[successColor, accentColor, warningColor, '#EC4899', '#8B5CF6']}
          />
        </View>
      ))}
    </>
  )
}

// Module-level counter for deterministic, collision-free confetti keys
let confettiKeyCounter = 0

export function ConfettiRoot() {
  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const trigger = useCallback(() => {
    const key = `confetti-${Date.now()}-${confettiKeyCounter++}`
    setActiveKeys(prev => [...prev, key])

    // Staggered: 240ms delay + 2900ms fallSpeed = 3140ms total.
    // Clean up at 3500ms to ensure full completion + fadeOut.
    const timeout = setTimeout(() => {
      setActiveKeys(prev => prev.filter(k => k !== key))
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== timeout)
    }, 3500)
    timeoutsRef.current.push(timeout)
  }, [])

  const stop = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setActiveKeys([])
  }, [])

  useEffect(() => {
    globalConfettiRef.current = { trigger, stop }
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [trigger, stop])

  if (activeKeys.length === 0) {
    return null
  }

  return <ConfettiRenderer activeKeys={activeKeys} />
}
