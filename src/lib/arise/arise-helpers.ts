import { setAudioModeAsync } from 'expo-audio'
import * as Haptics from 'expo-haptics'

import { colorModes } from '@/theme'

import type { AriseCallParams, AriseType } from './types'
import type { useAudioPlayer } from 'expo-audio'

// eslint-disable-next-line ts/no-require-imports
export const TOAST_SOUND = require('./toast-sound.wav')

interface IconConfig {
  iconName: string
  iconColor: string
  iconSize: number
}

const HAPTIC_MAP: Record<AriseType, Haptics.ImpactFeedbackStyle | 'none'> = {
  success: Haptics.ImpactFeedbackStyle.Medium,
  error: Haptics.ImpactFeedbackStyle.Medium,
  info: Haptics.ImpactFeedbackStyle.Medium,
  warn: Haptics.ImpactFeedbackStyle.Medium,
  custom: Haptics.ImpactFeedbackStyle.Medium,
}

const HAPTIC_STYLE_MAP = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const

const DEFAULT_ICON_CONFIGS: Record<AriseType, IconConfig> = {
  success: { iconName: 'CheckCircle', iconColor: colorModes.dark.foreground.success, iconSize: 36 },
  error: { iconName: 'XCircle', iconColor: colorModes.dark.foreground.danger, iconSize: 36 },
  info: { iconName: 'Info', iconColor: colorModes.dark.foreground.info, iconSize: 32 },
  warn: { iconName: 'TriangleAlert', iconColor: colorModes.dark.foreground.warning, iconSize: 32 },
  custom: { iconName: 'Info', iconColor: colorModes.dark.foreground.info, iconSize: 32 },
}

export function triggerHaptics(type: AriseType, haptic?: 'light' | 'medium' | 'heavy' | 'none') {
  if (haptic === 'none')
    return

  let style: Haptics.ImpactFeedbackStyle | undefined

  if (haptic) {
    style = HAPTIC_STYLE_MAP[haptic]
  }
  else {
    const mapped = HAPTIC_MAP[type]
    if (mapped !== 'none') {
      style = mapped
    }
  }

  if (style) {
    Haptics.impactAsync(style).catch(() => {})
  }
}

export function triggerSound(
  _type: AriseType,
  sound: boolean | string | undefined,
  player: ReturnType<typeof useAudioPlayer>,
) {
  const playSound = sound === undefined ? true : sound

  if (playSound === true) {
    player.seekTo(0)
      .then(() => {
        player.play()
      })
      .catch(() => {
        player.play()
      })
  }
}

export function resolveIconConfig(options: AriseCallParams) {
  const defaults = DEFAULT_ICON_CONFIGS[options.type]
  return {
    iconName: options.icon ?? defaults.iconName,
    iconColor: options.iconColor ?? defaults.iconColor,
    iconSize: defaults.iconSize,
  }
}

export function setupAudioMode() {
  setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  }).catch(() => {})
}
