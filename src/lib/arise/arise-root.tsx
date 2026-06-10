import { useAudioPlayer } from 'expo-audio'
import { CheckCircle, Info, TriangleAlert, XCircle } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, LinearTransition, SlideInUp, SlideOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/hooks/use-theme'

import { Confetti } from '../confetti'
import {
  resolveIconConfig,
  setupAudioMode,
  TOAST_SOUND,
  triggerHaptics,
  triggerSound,
} from './arise-helpers'
import { globalAriseRef } from './arise-ref'

import type { AriseCallParams } from './types'
import type { ThemeColors, ThemeRadius, ThemeSpacing, ThemeTypography } from '@/hooks/use-theme'

const { width: screenWidth } = Dimensions.get('window')

const ARISE_ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  XCircle,
  Info,
  TriangleAlert,
}
function createStyles(
  colors: ThemeColors,
  spacing: ThemeSpacing,
  typography: ThemeTypography,
  radius: ThemeRadius,
) {
  return StyleSheet.create({
    overlayContainer: {
      position: 'absolute',
      width: '100%',
      alignItems: 'center',
      zIndex: 9999,
    },
    pillContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 8,
      minWidth: 48,
      maxWidth: screenWidth - 32,
      height: 48,
      justifyContent: 'center',
    },
    textContainer: {
      marginLeft: spacing.md,
      paddingRight: spacing.sm,
      flexShrink: 1,
    },
    headingText: {
      color: colors.text,
      ...typography.bodySmStrong,
      fontWeight: '700',
    },
    contentText: {
      color: colors.textSecondary,
      ...typography.caption,
    },
  })
}

interface ArisePillProps {
  options: AriseCallParams
  isExpanded: boolean
  styles: ReturnType<typeof createStyles>
  spacing: ThemeSpacing
}

function ArisePill({ options, isExpanded, styles, spacing }: ArisePillProps) {
  const { iconName, iconColor, iconSize } = resolveIconConfig(options)
  const IconComponent = ARISE_ICONS[iconName as string] || Info

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(24).stiffness(120).mass(1.1)}
      exiting={SlideOutUp.springify().damping(26).stiffness(110).mass(1)}
      layout={LinearTransition.springify().damping(22).stiffness(120).mass(1)}
      style={[
        styles.pillContainer,
        {
          paddingHorizontal: isExpanded ? spacing.xl : 0,
        },
      ]}
    >
      <Animated.View>
        <IconComponent size={iconSize} color={iconColor} />
      </Animated.View>

      {isExpanded && (
        <Animated.View entering={FadeIn.duration(260).delay(220)} style={styles.textContainer}>
          <Text style={styles.headingText} ellipsizeMode="tail">
            {options.heading}
          </Text>
          {options.content && (
            <Text style={styles.contentText} ellipsizeMode="tail">
              {options.content}
            </Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  )
}

function clearRef(ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (ref.current) {
    clearTimeout(ref.current)
    ref.current = null
  }
}

function useAriseTimers() {
  const expandRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confettiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearCurrentRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAll = useCallback(() => {
    clearRef(expandRef)
    clearRef(confettiRef)
    clearRef(dismissRef)
    clearRef(clearCurrentRef)
    clearRef(cooldownRef)
  }, [])

  return { expandRef, confettiRef, dismissRef, clearCurrentRef, cooldownRef, clearAll }
}

interface NotificationLifecycleOptions {
  current: AriseCallParams | null
  completionPlayer: ReturnType<typeof useAudioPlayer>
  refs: {
    expandRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
    confettiRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
    dismissRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
    clearCurrentRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  }
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  setCurrent: (value: AriseCallParams | null) => void
  setCooldownActive: React.Dispatch<React.SetStateAction<boolean>>
}

function useNotificationLifecycle({ current, completionPlayer, refs, setIsExpanded, setCurrent, setCooldownActive }: NotificationLifecycleOptions) {
  const { expandRef, confettiRef, dismissRef, clearCurrentRef } = refs
  useEffect(() => {
    if (!current)
      return
    setIsExpanded(false)
    triggerHaptics(current.type, current.haptic)
    triggerSound(current.type, current.sound, completionPlayer)

    const expandTimer = setTimeout(() => {
      setIsExpanded(true)
    }, 580)
    expandRef.current = expandTimer

    let confettiTimer: ReturnType<typeof setTimeout> | null = null
    if (current.confetti) {
      confettiTimer = setTimeout(() => {
        Confetti.trigger()
      }, 150)
      confettiRef.current = confettiTimer
    }

    const duration = current.content ? 4000 : 3000
    let clearCurrentTimer: ReturnType<typeof setTimeout> | null = null
    const dismissTimer = setTimeout(() => {
      setIsExpanded(false)
      clearCurrentTimer = setTimeout(() => {
        setCurrent(null)
        setCooldownActive(true)
      }, 520)
      clearCurrentRef.current = clearCurrentTimer
    }, duration)
    dismissRef.current = dismissTimer

    return () => {
      clearTimeout(expandTimer)
      if (confettiTimer)
        clearTimeout(confettiTimer)
      clearTimeout(dismissTimer)
      if (clearCurrentTimer)
        clearTimeout(clearCurrentTimer)
    }
  }, [current, completionPlayer, expandRef, confettiRef, dismissRef, clearCurrentRef, setIsExpanded, setCurrent, setCooldownActive])
}

interface AriseQueueState {
  queue: AriseCallParams[]
  current: AriseCallParams | null
}

type QueueAction
  = | { type: 'ENQUEUE', payload: AriseCallParams }
    | { type: 'DEQUEUE' }
    | { type: 'CLEAR_CURRENT' }
    | { type: 'RESET' }

function queueReducer(state: AriseQueueState, action: QueueAction): AriseQueueState {
  switch (action.type) {
    case 'ENQUEUE':
      return state.queue.length >= 5 ? state : { ...state, queue: [...state.queue, action.payload] }
    case 'DEQUEUE':
      return { queue: state.queue.slice(1), current: state.queue[0] }
    case 'CLEAR_CURRENT':
      return { ...state, current: null }
    case 'RESET':
      return { queue: [], current: null }
    default:
      return state
  }
}

function useAriseQueue(completionPlayer: ReturnType<typeof useAudioPlayer>) {
  const [{ queue, current }, dispatch] = useReducer(queueReducer, { queue: [], current: null })
  const [cooldownActive, setCooldownActive] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const setCurrent = useCallback((value: AriseCallParams | null) => {
    if (value === null)
      dispatch({ type: 'CLEAR_CURRENT' })
  }, [])

  const { expandRef, confettiRef, dismissRef, clearCurrentRef, cooldownRef, clearAll } = useAriseTimers()

  useEffect(() => {
    setupAudioMode()
    return () => {
      clearAll()
    }
  }, [clearAll])

  const hide = useCallback(() => {
    clearAll()
    dispatch({ type: 'RESET' })
    setCooldownActive(false)
    setIsExpanded(false)
  }, [clearAll])

  const show = useCallback((params: AriseCallParams) => {
    dispatch({ type: 'ENQUEUE', payload: params })
  }, [])

  useEffect(() => {
    if (current || cooldownActive || queue.length === 0)
      return
    dispatch({ type: 'DEQUEUE' })
  }, [current, cooldownActive, queue])

  useNotificationLifecycle({ current, completionPlayer, refs: { expandRef, confettiRef, dismissRef, clearCurrentRef }, setIsExpanded, setCurrent, setCooldownActive })

  useEffect(() => {
    if (!cooldownActive)
      return
    const cooldownTimer = setTimeout(() => {
      setCooldownActive(false)
    }, 800)
    cooldownRef.current = cooldownTimer
    return () => {
      clearTimeout(cooldownTimer)
    }
  }, [cooldownActive, cooldownRef])

  return { current, isExpanded, show, hide }
}

export function AriseRoot() {
  const { colors, spacing, typography, radius } = useTheme()
  const styles = useMemo(
    () => createStyles(colors, spacing, typography, radius),
    [colors, spacing, typography, radius],
  )
  const insets = useSafeAreaInsets()
  const completionPlayer = useAudioPlayer(TOAST_SOUND)
  const { current, isExpanded, show, hide } = useAriseQueue(completionPlayer)

  useEffect(() => {
    globalAriseRef.current = { show, hide }
  }, [show, hide])

  if (!current)
    return null

  return (
    <View style={[styles.overlayContainer, { top: insets.top + 10 }]} pointerEvents="none">
      <ArisePill options={current} isExpanded={isExpanded} styles={styles} spacing={spacing} />
    </View>
  )
}
