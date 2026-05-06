import { Button } from '@/components/ui/buttons/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import { estimateBodyFatFromBMI } from '@/utils/analytics'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingPace() {
  const router = useRouter()
  const colors = useThemeColor()
  const {
    fitnessGoal,
    fitnessLevel,
    weight,
    height,
    gender,
    dateOfBirth,
    targetType,
    targetWeight,
    targetBodyFat,
    setTargetBodyFat: storeSetTargetBodyFat,
    setTargetWeight: storeSetTargetWeight,
    setWeeklyRate,
    setTargetDate,
  } = useOnboarding()

  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [manualDate, setManualDate] = useState<Date | null>(null)

  // Note: bodyFat calc requires measurements we might not have in onboarding if neck/waist aren't asked.
  // We'll approximate for now or assume weight targets if they haven't set bodyFat

  const handleNext = () => {
    let kgDifference = 0
    let wKg = weight || 0

    let currentBodyFat: number | null = null

    if (gender && dateOfBirth && height && weight) {
      const age = new Date().getFullYear() - dateOfBirth.getFullYear()
      currentBodyFat = estimateBodyFatFromBMI({
        gender,
        height,
        weight,
        age,
      })
    }

    if (targetType === 'weight' && targetWeight) {
      kgDifference = Math.abs(wKg - targetWeight)

      // Calculate projected Target Body Fat % based on current lean mass
      if (currentBodyFat !== null) {
        const currentFatMass = wKg * (currentBodyFat / 100)
        const leanMass = wKg - currentFatMass
        const projectedFatMass = Math.max(0, targetWeight - leanMass)
        const computedTargetBodyFat = (projectedFatMass / targetWeight) * 100

        storeSetTargetBodyFat(computedTargetBodyFat)
      }
    } else if (targetType === 'bodyFat' && targetBodyFat && currentBodyFat !== null) {
      const currentFatMass = wKg * (currentBodyFat / 100)
      const leanMass = wKg - currentFatMass
      const targetWeightToHitFat = leanMass / (1 - targetBodyFat / 100)
      kgDifference = Math.abs(wKg - targetWeightToHitFat)

      // Fill in the missing targetWeight for backend payload
      storeSetTargetWeight(targetWeightToHitFat, 'kg')
    }

    if (mode === 'manual') {
      if (!manualDate) {
        Toast.show({ type: 'error', text1: 'Please select a target date' })
        return
      }
      if (manualDate < new Date()) {
        Toast.show({ type: 'error', text1: 'Please select a future date' })
        return
      }

      // Calculate required weekly rate to hit target
      const diffTime = Math.abs(manualDate.getTime() - new Date().getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffWeeks = Math.max(diffDays / 7, 1) // Minimum 1 week to avoid infinity

      const requiredWeeklyRateKg = kgDifference / diffWeeks

      setTargetDate(manualDate)
      setWeeklyRate(requiredWeeklyRateKg, 'kg')
    } else {
      // Auto mode pace
      let weeklyRateKg = 0

      if (fitnessGoal === 'loseWeight') {
        // Fat loss dependent on starting body fat (if computable)
        let ratePercentage = 0.7 // Default fallback

        if (currentBodyFat !== null) {
          if (gender === 'male') {
            if (currentBodyFat > 25) ratePercentage = 0.7
            else if (currentBodyFat >= 15) ratePercentage = 0.5
            else ratePercentage = 0.25
          } else if (gender === 'female') {
            if (currentBodyFat > 32) ratePercentage = 0.7
            else if (currentBodyFat >= 24) ratePercentage = 0.5
            else ratePercentage = 0.5
          }
        }

        weeklyRateKg = (ratePercentage * wKg) / 100
      } else {
        // Muscle gain dependent on experience level (fitnessLevel)
        let ratePercentage = 0.25 // Default fallback

        if (fitnessLevel === 'beginner') {
          ratePercentage = 0.35 // Up to ~1.5% per month
        } else if (fitnessLevel === 'intermediate') {
          ratePercentage = 0.2 // ~0.8% per month
        } else if (fitnessLevel === 'advanced') {
          ratePercentage = 0.1 // ~0.4% per month
        }

        weeklyRateKg = (ratePercentage * wKg) / 100
      }

      setWeeklyRate(weeklyRateKg, 'kg')

      if (kgDifference > 0 && weeklyRateKg > 0) {
        const weeksNeeded = kgDifference / weeklyRateKg
        const projectedDate = new Date()
        projectedDate.setDate(projectedDate.getDate() + Math.ceil(weeksNeeded * 7))
        setTargetDate(projectedDate)
      } else {
        setTargetDate(null)
      }
    }

    router.push('/(auth)/onboarding/activity')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">
          How fast would you like to reach this?
        </Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          Choose to let us recommend a safe pace, or set a target date.
        </Text>

        <View className="mb-8 flex-row gap-2">
          <SelectableCard
            title="Auto (Recommended)"
            selected={mode === 'auto'}
            onSelect={() => setMode('auto')}
            className="flex-1 p-4"
          />
          <SelectableCard
            title="Choose End Date"
            selected={mode === 'manual'}
            onSelect={() => setMode('manual')}
            className="flex-1 p-4"
          />
        </View>

        {mode === 'manual' && (
          <View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-black dark:text-white">Target Date</Text>
              <DateTimePicker
                value={manualDate || new Date()}
                onUpdate={setManualDate}
                isModal={true}
                dateOnly={true}
                title="Select End Date"
                textClassName="text-lg text-black dark:text-white text-center"
                minimumDate={new Date()}
              />
            </View>
          </View>
        )}

        <View className="mt-8 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <Text className="text-sm text-blue-800 dark:text-blue-200">
            {mode === 'auto'
              ? "We'll apply a scientifically safe weekly rate. For fat loss, this is usually 0.5% - 1% of body weight per week."
              : "We'll auto-calculate your required weekly deficit/surplus to hit this date. If it's too aggressive, you'll be warned."}
          </Text>
        </View>
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
            title="Next Step"
            variant="primary"
            onPress={handleNext}
            fullWidth
            rightIcon={
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.icon} />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
