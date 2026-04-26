import { useCountUp } from '@/hooks/ui-utils'
import { useThemeColor } from '@/hooks/theme'
import { WeightUnits } from '@/types/me'
import { BodyFatFeedback, classifyBodyFat } from '@/utils/analytics'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  FadeInDown,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { BodyFatRing } from './BodyFatRing'

// Safe Athletic colors (starting point for badge color interpolation)
const SAFE_BADGE_COLOR = '#3b82f6'

interface CompositionData {
  bodyFat: number
  leanMass: number
  fatMass: number
  bmi: number | null
}

interface MuscleCompositionCardProps {
  composition: CompositionData | null
  gender: 'male' | 'female' | 'other' | null | undefined
  goal?: string | null
  /** The user's preferred weight unit — fatMass/leanMass values passed here must already be in this unit */
  preferredWeightUnit: WeightUnits
}

export function MuscleCompositionCard({
  composition,
  gender,
  goal,
  preferredWeightUnit,
}: MuscleCompositionCardProps) {
  const colors = useThemeColor()
  const isDark = colors.isDark

  const isIncomplete =
    !composition ||
    !gender ||
    gender === 'other' || // body fat formula only defined for male/female
    composition.bodyFat == null ||
    composition.leanMass == null ||
    composition.fatMass == null ||
    composition.bmi == null

  // Narrowed gender for classifyBodyFat which requires 'male' | 'female'
  const binaryGender = gender === 'male' || gender === 'female' ? gender : null

  let feedback: BodyFatFeedback | null = null

  if (!isIncomplete && binaryGender) {
    feedback = classifyBodyFat({
      gender: binaryGender,
      bodyFat: composition.bodyFat,
      goal,
    })
  }

  // Number counters — all count up 0 → target
  const leanMassDisplay = useCountUp(composition?.leanMass ?? null, 1, 500)
  const fatMassDisplay = useCountUp(composition?.fatMass ?? null, 1, 600)
  const bmiDisplay = useCountUp(composition?.bmi ?? null, 1, 700)

  // Badge color: animate from safe Athletic blue → actual category color via JS state
  const badgeProgress = useSharedValue(0)
  const [badgeBgColor, setBadgeBgColor] = useState(SAFE_BADGE_COLOR + '20')
  const [badgeTextColor, setBadgeTextColor] = useState(SAFE_BADGE_COLOR)

  const targetBadgeColor = feedback?.colorStart ?? SAFE_BADGE_COLOR

  useEffect(() => {
    badgeProgress.value = 0
    setBadgeBgColor(SAFE_BADGE_COLOR + '20')
    setBadgeTextColor(SAFE_BADGE_COLOR)
    badgeProgress.value = withDelay(
      300,
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetBadgeColor])

  useAnimatedReaction(
    () => Math.round(badgeProgress.value * 50) / 50,
    (val) => {
      'worklet'
      const textColor = interpolateColor(val, [0, 1], [SAFE_BADGE_COLOR, targetBadgeColor])
      const bgColor = interpolateColor(
        val,
        [0, 1],
        [SAFE_BADGE_COLOR + '20', targetBadgeColor + '20'],
      )
      runOnJS(setBadgeTextColor)(textColor)
      runOnJS(setBadgeBgColor)(bgColor)
    },
  )

  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(500)}
      className={`relative m-4 rounded-3xl border p-4 shadow-sm ${
        isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
      }`}
    >
      <View>
        <Text
          className={`text-sm font-semibold tracking-wide ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}
        >
          Muscle Composition
        </Text>

        <View className="w-full flex-row items-center justify-between">
          {/* Left Column: Ring and Badge */}
          <View className="flex-1 items-center">
            <View className="items-center">
              <BodyFatRing
                percentage={composition?.bodyFat ?? 0}
                colorStart={feedback?.colorStart ?? SAFE_BADGE_COLOR}
                colorEnd={feedback?.colorEnd ?? '#22c55e'}
              />
            </View>

            {/* Category badge with animated color driven by JS state */}
            <View
              className="self-center rounded-full px-4 py-1.5"
              style={{ backgroundColor: badgeBgColor }}
            >
              <Text className="text-xs font-semibold" style={{ color: badgeTextColor }}>
                {feedback?.category ?? '--'}
              </Text>
            </View>
          </View>

          {/* Right Column: Vertical Stats (replacing Horizontal Bottom Row) */}
          <View className="flex-1 items-center gap-4">
            <AnimatedStatBlock
              label="Lean Mass"
              value={composition?.leanMass != null ? leanMassDisplay : '--'}
              unit={composition?.leanMass != null ? preferredWeightUnit : ''}
              delay={500}
              textColor={colors.text}
              labelColor={isDark ? 'text-neutral-400' : 'text-neutral-500'}
            />
            <AnimatedStatBlock
              label="Fat Mass"
              value={composition?.fatMass != null ? fatMassDisplay : '--'}
              unit={composition?.fatMass != null ? preferredWeightUnit : ''}
              delay={600}
              textColor={colors.text}
              labelColor={isDark ? 'text-neutral-400' : 'text-neutral-500'}
            />
            <AnimatedStatBlock
              label="BMI"
              value={composition?.bmi != null ? bmiDisplay : '--'}
              unit=""
              delay={700}
              textColor={colors.text}
              labelColor={isDark ? 'text-neutral-400' : 'text-neutral-500'}
            />
          </View>
        </View>

        {/* <Text className={`mt-6 text-center text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
					{insight ?? 'Complete your measurements to unlock insights.'}
				</Text> */}
      </View>

      {/* Overlay when data is incomplete */}
      {isIncomplete && (
        <View
          className={`absolute inset-0 items-center justify-center rounded-3xl ${
            isDark ? 'bg-neutral-900/90' : 'bg-white/90'
          }`}
        >
          <View className="items-center px-6">
            <Ionicons name="lock-closed-outline" size={28} color={colors.text} />
            <Text className="mt-3 text-center text-sm font-medium" style={{ color: colors.text }}>
              Complete your profile and measurement details to unlock muscle composition insights
            </Text>

            <View className="mt-4 rounded-full px-4 py-2" style={{ backgroundColor: colors.text }}>
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.background }}
                onPress={() => router.push('/(app)/(tabs)/profile')}
              >
                Update Profile & Measurements
              </Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  )
}

function AnimatedStatBlock({
  label,
  value,
  unit,
  delay,
  textColor,
  labelColor,
}: {
  label: string
  value: string
  unit: string
  delay: number
  textColor?: string
  labelColor?: string
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} className="items-center">
      <Text className="text-lg font-bold" style={textColor ? { color: textColor } : undefined}>
        {value}
        {unit ? ` ${unit}` : ''}
      </Text>
      <Text className={`mt-1 text-[10px] uppercase tracking-wider ${labelColor ? labelColor : ''}`}>
        {label}
      </Text>
    </Animated.View>
  )
}
