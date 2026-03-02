import { useThemeColor } from '@/hooks/useThemeColor'
import { WeightUnits } from '@/stores/userStore'
import { BodyFatFeedback, calculateHealthScore, classifyBMI, classifyBodyFat, generateInsight } from '@/utils/analytics'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
	Easing,
	FadeInDown,
	interpolateColor,
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
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

/** Animates a number from 0 → target on mount, returns formatted string */
function useCountUp(target: number | null, decimals = 1, delay = 400): string {
	const [display, setDisplay] = useState('--')
	const sv = useSharedValue(0)

	useEffect(() => {
		if (target == null) {
			setDisplay('--')
			return
		}
		sv.value = 0
		setDisplay('0.' + '0'.repeat(decimals))
		sv.value = withDelay(
			delay,
			withTiming(target, {
				duration: 1400,
				easing: Easing.out(Easing.cubic),
			})
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target])

	useAnimatedReaction(
		() => sv.value,
		val => {
			if (target != null) {
				runOnJS(setDisplay)(val.toFixed(decimals))
			}
		}
	)

	return display
}

export function MuscleCompositionCard({ composition, gender, goal, preferredWeightUnit }: MuscleCompositionCardProps) {
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
	let bmiCategory: string | null = null
	let healthScore: number | null = null
	let insight: string | null = null

	if (!isIncomplete && binaryGender) {
		feedback = classifyBodyFat({
			gender: binaryGender,
			bodyFat: composition.bodyFat,
			goal,
		})

		bmiCategory = classifyBMI(composition.bmi!)

		healthScore = calculateHealthScore({
			bodyFatCategory: feedback.category,
			bmi: composition.bmi!,
			goal,
		})

		insight = generateInsight({
			bodyFatCategory: feedback.category,
			bmiCategory,
		})
	}

	// Number counters — all count up 0 → target
	const leanMassDisplay = useCountUp(composition?.leanMass ?? null, 1, 500)
	const fatMassDisplay = useCountUp(composition?.fatMass ?? null, 1, 600)
	const bmiDisplay = useCountUp(composition?.bmi ?? null, 1, 700)
	const healthScoreDisplay = useCountUp(healthScore, 0, 400)

	// Badge color: animate from safe Athletic blue → actual category color via JS state
	const badgeProgress = useSharedValue(0)
	const [badgeBgColor, setBadgeBgColor] = useState(SAFE_BADGE_COLOR + '20')
	const [badgeTextColor, setBadgeTextColor] = useState(SAFE_BADGE_COLOR)

	const targetBadgeColor = feedback?.colorStart ?? SAFE_BADGE_COLOR

	useEffect(() => {
		badgeProgress.value = 0
		setBadgeBgColor(SAFE_BADGE_COLOR + '20')
		setBadgeTextColor(SAFE_BADGE_COLOR)
		badgeProgress.value = withDelay(300, withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [targetBadgeColor])

	useAnimatedReaction(
		() => Math.round(badgeProgress.value * 50) / 50,
		val => {
			'worklet'
			const textColor = interpolateColor(val, [0, 1], [SAFE_BADGE_COLOR, targetBadgeColor])
			const bgColor = interpolateColor(val, [0, 1], [SAFE_BADGE_COLOR + '20', targetBadgeColor + '20'])
			runOnJS(setBadgeTextColor)(textColor)
			runOnJS(setBadgeBgColor)(bgColor)
		}
	)

	// Health score box fade-in using proper shared values
	const healthOpacity = useSharedValue(0)
	const healthTranslateY = useSharedValue(12)

	useEffect(() => {
		healthOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }))
		healthTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const healthCardStyle = useAnimatedStyle(() => ({
		opacity: healthOpacity.value,
		transform: [{ translateY: healthTranslateY.value }],
	}))

	return (
		<Animated.View
			entering={FadeInDown.delay(0).duration(500)}
			style={[
				styles.card,
				{
					backgroundColor: isDark ? '#171717' : '#fff',
					borderColor: isDark ? '#262626' : '#e5e7eb',
				},
			]}
		>
			<View>
				<Text style={[styles.cardTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Muscle Composition</Text>

				<View style={styles.ringRow}>
					<View>
						<View style={styles.ringWrapper}>
							<BodyFatRing
								percentage={composition?.bodyFat ?? 0}
								colorStart={feedback?.colorStart ?? SAFE_BADGE_COLOR}
								colorEnd={feedback?.colorEnd ?? '#22c55e'}
							/>
						</View>

						{/* Category badge with animated color driven by JS state */}
						<View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
							<Text style={[styles.badgeText, { color: badgeTextColor }]}>
								{feedback?.category ?? '--'}
							</Text>
						</View>
					</View>

					{/* Health Score */}
					<Animated.View style={[styles.healthScoreBox, healthCardStyle]}>
						<Text style={[styles.healthScoreLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
							Health Score
						</Text>
						<Text style={[styles.healthScoreValue, { color: colors.text }]}>
							{healthScore != null ? `${healthScoreDisplay} / 100` : '--'}
						</Text>
					</Animated.View>
				</View>

				<Text style={[styles.insight, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
					{insight ?? 'Complete your measurements to unlock insights.'}
				</Text>

				<View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#e5e7eb' }]} />

				{/* Stats row */}
				<View style={styles.statsRow}>
					<AnimatedStatBlock
						label="Lean Mass"
						value={composition?.leanMass != null ? leanMassDisplay : '--'}
						unit={composition?.leanMass != null ? preferredWeightUnit : ''}
						delay={500}
						textColor={colors.text}
						labelColor={isDark ? '#9ca3af' : '#6b7280'}
					/>
					<AnimatedStatBlock
						label="Fat Mass"
						value={composition?.fatMass != null ? fatMassDisplay : '--'}
						unit={composition?.fatMass != null ? preferredWeightUnit : ''}
						delay={600}
						textColor={colors.text}
						labelColor={isDark ? '#9ca3af' : '#6b7280'}
					/>
					<AnimatedStatBlock
						label="BMI"
						value={composition?.bmi != null ? bmiDisplay : '--'}
						unit=""
						delay={700}
						textColor={colors.text}
						labelColor={isDark ? '#9ca3af' : '#6b7280'}
					/>
				</View>
			</View>

			{/* Overlay when data is incomplete */}
			{isIncomplete && (
				<View
					style={[
						styles.overlay,
						{ backgroundColor: isDark ? 'rgba(23,23,23,0.88)' : 'rgba(255,255,255,0.88)' },
					]}
				>
					<View style={styles.overlayContent}>
						<Ionicons name="lock-closed-outline" size={28} color={colors.text} />
						<Text style={[styles.overlayText, { color: colors.text }]}>
							Update your measurements to unlock muscle composition insights
						</Text>

						<View style={[styles.overlayButton, { backgroundColor: colors.text }]}>
							<Text
								style={[styles.overlayButtonText, { color: colors.background }]}
								onPress={() => router.push('/(app)/(tabs)/profile')}
							>
								Update Measurements
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
		<Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.statBlock}>
			<Text style={[styles.statValue, textColor ? { color: textColor } : undefined]}>
				{value}
				{unit ? ` ${unit}` : ''}
			</Text>
			<Text style={[styles.statLabel, labelColor ? { color: labelColor } : undefined]}>{label}</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	card: {
		position: 'relative',
		borderRadius: 24,
		borderWidth: 1,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
	ringRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		marginTop: 4,
	},
	ringWrapper: {
		marginTop: 4,
		alignItems: 'center',
	},
	badge: {
		marginTop: 8,
		alignSelf: 'center',
		borderRadius: 999,
		paddingHorizontal: 16,
		paddingVertical: 4,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: '600',
	},
	healthScoreBox: {
		marginTop: 12,
		alignItems: 'center',
	},
	healthScoreLabel: {
		fontSize: 10,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	healthScoreValue: {
		marginTop: 4,
		fontSize: 22,
		fontWeight: '700',
	},
	insight: {
		marginTop: 16,
		textAlign: 'center',
		fontSize: 13,
	},
	divider: {
		marginVertical: 20,
		height: 1,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	statBlock: {
		flex: 1,
		alignItems: 'center',
	},
	statValue: {
		fontSize: 16,
		fontWeight: '600',
	},
	statLabel: {
		marginTop: 4,
		fontSize: 10,
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 24,
	},
	overlayContent: {
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	overlayText: {
		marginTop: 12,
		textAlign: 'center',
		fontSize: 13,
		fontWeight: '500',
	},
	overlayButton: {
		marginTop: 16,
		borderRadius: 999,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	overlayButtonText: {
		fontSize: 12,
		fontWeight: '600',
	},
})
