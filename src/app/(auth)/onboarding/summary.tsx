import { Button } from '@/components/ui/buttons/Button'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import {
  calculateBMI,
  calculateBMR,
  calculateDailyTargets,
  calculateTDEE,
  classifyBMI,
  estimateBodyFatFromBMI,
} from '@/utils/analytics'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingSummary() {
  const router = useRouter()
  const colors = useThemeColor()
  const {
    gender,
    weight,
    height,
    dateOfBirth,
    fitnessGoal,
    activityLevel,
    fitnessLevel,
    weeklyRate,
    weightUnit,
  } = useOnboarding()

  // Compute Derived Stats
  const stats = useMemo(() => {
    if (!weight || !height || !gender || !dateOfBirth || !activityLevel || !fitnessGoal) return null

    const age = new Date().getFullYear() - dateOfBirth.getFullYear()

    const bmr = calculateBMR(weight, height, age, gender)
    const tdee = calculateTDEE(bmr, activityLevel)

    const bmi = calculateBMI(weight, height)
    const bmiClass = bmi ? classifyBMI(bmi) : null
    const estimatedBodyFat = estimateBodyFatFromBMI({ weight, height, age, gender })

    const targets = calculateDailyTargets({
      tdee,
      weightKg: weight,
      goal: fitnessGoal,
      fitnessLevel,
      weeklyRateKg: weeklyRate,
    })

    // Determine Risk Level (simplified for UI)
    let riskBadge = 'Moderate'
    let riskColor =
      'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'

    if (fitnessGoal === 'loseWeight' && weeklyRate) {
      const percentPerWeek = (weeklyRate / weight) * 100
      if (percentPerWeek <= 0.5) {
        riskBadge = 'Conservative'
        riskColor =
          'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      } else if (percentPerWeek > 1) {
        riskBadge = 'Aggressive'
        riskColor =
          'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      }
    } else if (fitnessGoal === 'gainMuscle' && weeklyRate) {
      if (weeklyRate <= 0.25) {
        riskBadge = 'Conservative'
        riskColor =
          'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      } else if (weeklyRate > 0.5) {
        riskBadge = 'Aggressive'
        riskColor =
          'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      }
    }

    return {
      ...targets,
      bmr,
      bmi,
      bmiClass,
      estimatedBodyFat,
      tdee,
      riskBadge,
      riskColor,
    }
  }, [gender, weight, height, dateOfBirth, activityLevel, fitnessLevel, fitnessGoal, weeklyRate])

  const handleFinish = () => {
    if (!stats) {
      Toast.show({ type: 'error', text1: 'Missing data to complete setup' })
      return
    }

    // Note: At login time in `login.tsx`, we call `onboarding.getPayload()` and push it to `auth.googleLogin` or `updateUserFitnessProfile` if already logged in.
    router.push('/(auth)/login')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">Your Plan</Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          Based on your biology and ambition, here&apos;s the science-backed strategy we&apos;ve
          built for you.
        </Text>

        {stats ? (
          <View className="flex gap-4">
            {/* Strategy Overview */}
            <View className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-black dark:text-white">
                  {fitnessGoal === 'loseWeight' ? 'Fat Loss Phase' : 'Muscle Gain Phase'}
                </Text>
                <View className={`rounded-full border px-3 py-1 ${stats.riskColor}`}>
                  <Text className="text-xs font-semibold text-black dark:text-white">
                    {stats.riskBadge}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
                <Text className="text-neutral-500 dark:text-neutral-400">Weekly Pace</Text>
                <Text className="text-lg font-semibold text-black dark:text-white">
                  {weeklyRate ? `${weeklyRate} ${weightUnit}/week` : 'Auto-paced'}
                </Text>
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-neutral-500 dark:text-neutral-400">Pace Adjustment</Text>
                <Text className="text-lg font-semibold text-black dark:text-white">
                  {stats.deficitOrSurplus > 0 ? '+' : ''}
                  {stats.deficitOrSurplus} kcal/day
                </Text>
              </View>
            </View>

            {/* Body Profile */}
            <View className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <Text className="mb-4 text-xl font-bold text-black dark:text-white">
                Your Profile
              </Text>

              <View className="flex-row flex-wrap justify-between gap-y-4">
                <View className="w-[48%]">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">BMI</Text>
                  <View className="mt-1 flex-row items-end gap-2">
                    <Text className="text-2xl font-bold text-black dark:text-white">
                      {stats.bmi ? stats.bmi.toFixed(1) : '--'}
                    </Text>
                    {stats.bmiClass && (
                      <Text className="mb-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {stats.bmiClass}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="w-[48%]">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Est. Body Fat
                  </Text>
                  <Text className="mt-1 text-2xl font-bold text-black dark:text-white">
                    {stats.estimatedBodyFat ? `${Math.round(stats.estimatedBodyFat)}%` : '--'}
                  </Text>
                </View>

                <View className="mt-2 w-[48%]">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Basal (BMR)
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-black dark:text-white">
                    {stats.bmr} kcal
                  </Text>
                </View>

                <View className="mt-2 w-[48%]">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Total (TDEE)
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-black dark:text-white">
                    {stats.tdee} kcal
                  </Text>
                </View>
              </View>
            </View>

            {/* Nutrition Targets */}
            <Text className="mt-2 text-xl font-bold text-black dark:text-white">Daily Targets</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <MaterialCommunityIcons
                  name="fire"
                  size={24}
                  color={colors.primary}
                  className="mb-2"
                />
                <Text className="mb-1 text-2xl font-bold text-black dark:text-white">
                  {stats.caloriesTarget}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  Calories (kcal)
                </Text>
              </View>

              <View className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <MaterialCommunityIcons
                  name="food-steak"
                  size={24}
                  color="#E11D48"
                  className="mb-2"
                />
                <Text className="mb-1 text-2xl font-bold text-black dark:text-white">
                  {stats.proteinTarget}g
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">Protein</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <MaterialCommunityIcons
                  name="baguette"
                  size={24}
                  color="#D97706"
                  className="mb-2"
                />
                <Text className="mb-1 text-2xl font-bold text-black dark:text-white">
                  {stats.carbsTarget}g
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">Carbs</Text>
              </View>

              <View className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <MaterialCommunityIcons name="peanut" size={24} color="#059669" className="mb-2" />
                <Text className="mb-1 text-2xl font-bold text-black dark:text-white">
                  {stats.fatsTarget}g
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">Fats</Text>
              </View>
            </View>

            {stats.riskBadge === 'Aggressive' && (
              <View className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                <Text className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Warning: Aggressive Protocol
                </Text>
                <Text className="mt-1 text-xs text-red-600 dark:text-red-300">
                  This goal requires a significant daily change and may be biologically taxing.
                  Monitor your energy, mood, and sleep. We recommend adjusting if you feel fatigued.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
            <Text className="text-sm font-semibold text-red-800 dark:text-red-200">Error</Text>
            <Text className="text-xs text-red-600 dark:text-red-300">
              Missing configuration data. Please go back and ensure you&apos;ve filled out your age,
              height, and gender.
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex items-center justify-center border-t border-neutral-100 bg-white p-6 dark:border-neutral-900 dark:bg-black">
        <View className="flex flex-row items-center justify-between gap-4 px-8">
          <Button
            className="rounded-full"
            title=""
            onPress={handleBack}
            leftIcon={<MaterialCommunityIcons name="chevron-left" size={24} color={colors.icon} />}
          />
          <Button
            title="Finalize & Start"
            variant="primary"
            onPress={handleFinish}
            fullWidth
            rightIcon={<Text className="text-white">✓</Text>}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
