import { Ionicons } from '@expo/vector-icons'
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import Animated, { FadeIn, LinearTransition, SlideInUp, SlideOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { IoniconName } from '@/types/navigation'

import { globalAriseRef } from './ariseRef'
import type { AriseCallParams } from './types'

const REST_TIMER_DONE_SOUND =
  'data:audio/wav;base64,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'


export function AriseRoot() {
  const [options, setOptions] = useState<AriseCallParams | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const insets = useSafeAreaInsets()
  const completionPlayer = useAudioPlayer(REST_TIMER_DONE_SOUND)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {})
  }, [])

  const hide = useCallback(() => {
    setIsExpanded(false)
    setShowConfetti(false)

    // Wait for the collapse animation before completely removing it
    setTimeout(() => {
      setOptions(null)
    }, 520)
  }, [])

  const show = useCallback(
    (params: AriseCallParams) => {
      // Clear any existing timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      setOptions(params)
      setIsExpanded(false)
      setShowConfetti(false)

      // Trigger Haptics
      let hapticType = params.haptic
      if (!hapticType && params.type === 'success') hapticType = 'medium'
      if (!hapticType && params.type === 'error') hapticType = 'heavy'
      if (!hapticType && params.type === 'info') hapticType = 'light'
      if (!hapticType && params.type === 'warn') hapticType = 'medium'
      if (!hapticType && params.type === 'custom') hapticType = 'light'

      if (hapticType && hapticType !== 'none') {
        if (hapticType === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        if (hapticType === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        if (hapticType === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }

      // Trigger Sound
      let playSound = params.sound
      if (playSound === undefined && params.type === 'success') playSound = true

      if (playSound === true) {
        completionPlayer.seekTo(0).catch(() => {})
        completionPlayer.play()
      }

      // Phase 2: Expand after dropping in
      setTimeout(() => {
        setIsExpanded(true)
        if (params.confetti) {
          setShowConfetti(true)
        }
      }, 580)

      // Phase 3 & 4: Auto hide after hold
      timeoutRef.current = setTimeout(
        () => {
          hide()
        },
        params.content ? 4000 : 3000,
      ) // Show slightly longer if there is content
    },
    [completionPlayer, hide],
  )

  useEffect(() => {
    if (globalAriseRef) {
      ;(globalAriseRef as any).current = { show, hide }
    }
  }, [show, hide])

  if (!options) return null

  // Determine Icon, Colors and Size based on Type and Options
  let iconName = options.icon ?? 'information-circle'
  let iconColor = options.iconColor ?? '#3b82f6' // Blue default
  let iconSize = 32

  if (options.type === 'success') {
    iconName = options.icon ?? 'checkmark-circle'
    iconColor = options.iconColor ?? '#10b981' // Emerald
    iconSize = 36
  } else if (options.type === 'error') {
    iconName = options.icon ?? 'close-circle'
    iconColor = options.iconColor ?? '#ef4444' // Red
    iconSize = 36
  } else if (options.type === 'info') {
    iconName = options.icon ?? 'information-circle'
    iconColor = options.iconColor ?? '#3b82f6' // Blue
  } else if (options.type === 'warn') {
    iconName = options.icon ?? 'warning'
    iconColor = options.iconColor ?? '#f59e0b' // Yellow
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 10,
        width: '100%',
        alignItems: 'center',
        zIndex: 9999,
      }}
      pointerEvents="none"
    >
      <Animated.View
        entering={SlideInUp.springify().damping(24).stiffness(120).mass(1.1)}
        exiting={SlideOutUp.springify().damping(26).stiffness(110).mass(1)}
        layout={LinearTransition.springify().damping(22).stiffness(120).mass(1)}
        className="flex-row items-center overflow-hidden rounded-full bg-neutral-900 shadow-xl dark:bg-neutral-800"
        style={{
          minWidth: 48,
          height: 48,
          paddingHorizontal: isExpanded ? 20 : 0,
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName as IoniconName} size={iconSize} color={iconColor} />

        {isExpanded && (
          <Animated.View entering={FadeIn.duration(260).delay(220)} className="ml-3 pr-2">
            <Text className="text-sm font-bold text-white">{options.heading}</Text>
            {options.content && (
              <Text className="mt-0.5 text-xs text-neutral-300">{options.content}</Text>
            )}
          </Animated.View>
        )}
      </Animated.View>

      {showConfetti && (
        <View style={{ position: 'absolute', top: 24 }}>
          <ConfettiCannon
            count={50}
            origin={{ x: 0, y: 0 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3000}
            explosionSpeed={350}
            colors={['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']}
          />
        </View>
      )}
    </View>
  )
}
