import { useEffect, useState } from 'react'
import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

// Safe "starting" Athletic colors — ring always animates FROM these
const SAFE_COLOR_START = '#3b82f6'
const SAFE_COLOR_END = '#22c55e'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export function BodyFatRing({
  percentage,
  colorStart,
  colorEnd,
}: {
  percentage: number
  colorStart: string
  colorEnd: string
}) {
  const isDark = useColorScheme() === 'dark'
  const size = 160
  const strokeWidth = 14
  const radius = 60
  const circumference = 2 * Math.PI * radius

  // Shared progress value 0 → 1
  const progress = useSharedValue(0)

  // JS state for text (driven via useAnimatedReaction + runOnJS)
  const [displayPct, setDisplayPct] = useState('0.0%')

  // JS state for gradient colors (Stop is not a host component — can't use animatedProps)
  const [gradColorStart, setGradColorStart] = useState(SAFE_COLOR_START)
  const [gradColorEnd, setGradColorEnd] = useState(SAFE_COLOR_END)

  useEffect(() => {
    progress.value = 0
    setDisplayPct('0.0%')
    setGradColorStart(SAFE_COLOR_START)
    setGradColorEnd(SAFE_COLOR_END)
    progress.value = withDelay(
      300,
      withTiming(1, {
        duration: 1800,
        easing: Easing.out(Easing.cubic),
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage])

  // Drive text on every frame
  useAnimatedReaction(
    () => progress.value,
    (val) => {
      runOnJS(setDisplayPct)((percentage * val).toFixed(1) + '%')
    },
  )

  // Drive gradient colors on every frame (sampled ~every 2% change to reduce JS bridge load)
  useAnimatedReaction(
    () => Math.round(progress.value * 50) / 50, // quantise to reduce bridge calls
    (val) => {
      'worklet'
      const cs = interpolateColor(val, [0, 1], [SAFE_COLOR_START, colorStart])
      const ce = interpolateColor(val, [0, 1], [SAFE_COLOR_END, colorEnd])
      runOnJS(setGradColorStart)(cs)
      runOnJS(setGradColorEnd)(ce)
    },
  )

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="bodyFatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradColorStart} stopOpacity={1} />
            <Stop offset="100%" stopColor={gradColorEnd} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          stroke="#e5e7eb"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          opacity={0.25}
        />

        {/* Progress arc — starts at 12 o'clock via rotation */}
        <AnimatedCircle
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          stroke="url(#bodyFatGrad)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </Svg>

      {/* Centered text overlay */}
      <View style={styles.textOverlay}>
        <Text style={[styles.pctText, { color: isDark ? '#fff' : '#000' }]}>{displayPct}</Text>
        <Text style={styles.label}>Body Fat</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  pctText: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
})
