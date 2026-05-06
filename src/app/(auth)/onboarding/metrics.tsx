import { UnitToggle } from '@/components/me/UnitToggle'
import { Button } from '@/components/ui/buttons/Button'
import { TextInput } from '@/components/ui/TextInput'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingMetrics() {
  const router = useRouter()
  const colors = useThemeColor()
  const {
    weight,
    height,
    weightUnit,
    heightUnit,
    setWeight,
    setHeight,
    setWeightUnit,
    setHeightUnit,
  } = useOnboarding()

  const [weightInput, setWeightInput] = useState(weight ? weight.toString() : '')
  const [heightInput, setHeightInput] = useState(height ? height.toString() : '')

  const handleFinish = () => {
    const w = parseFloat(weightInput)
    const h = parseFloat(heightInput)

    if (!weightInput || isNaN(w) || w <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid weight' })
      return
    }
    if (!heightInput || isNaN(h) || h <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid height' })
      return
    }

    // Store final values
    setWeight(w, weightUnit)
    setHeight(h, heightUnit)

    // Proceed to goal selection
    router.push('/(auth)/onboarding/goal')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">Body Metrics</Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          We use this to track your progress and calculate BMI/macros.
        </Text>

        {/* Weight Section */}
        <View className="mb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-black dark:text-white">Weight</Text>
            <View className="w-32">
              <UnitToggle
                options={['KG', 'LBS']}
                selectedIndex={weightUnit === 'kg' ? 0 : 1}
                onOnChange={(idx) => {
                  // If switching units, we could convert the input value visually
                  // For now, let's just clear or keep the number?
                  // Standard UX: keep number but it changes meaning? Or convert?
                  // For MVP, user toggles unit THEN types usually.
                  setWeightUnit(idx === 0 ? 'kg' : 'lbs')
                }}
              />
            </View>
          </View>
          <TextInput
            placeholder="0.0"
            keyboardType="numeric"
            value={weightInput}
            onChangeText={setWeightInput}
            containerClassName="mb-1"
            rightElement={
              <Text className="ml-2 font-medium text-neutral-400">{weightUnit.toUpperCase()}</Text>
            }
          />
        </View>

        {/* Height Section */}
        <View className="mb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-black dark:text-white">Height</Text>
            <View className="w-32">
              <UnitToggle
                options={['CM', 'FT']}
                selectedIndex={heightUnit === 'cm' ? 0 : 1}
                onOnChange={(idx) => {
                  setHeightUnit(idx === 0 ? 'cm' : 'inches')
                }}
              />
            </View>
          </View>
          <TextInput
            placeholder="0.0"
            keyboardType="numeric"
            value={heightInput}
            onChangeText={setHeightInput}
            containerClassName="mb-1"
            rightElement={
              <Text className="ml-2 font-medium text-neutral-400">
                {heightUnit === 'inches' ? 'FT' : heightUnit.toUpperCase()}
              </Text>
            }
          />
          {heightUnit === 'inches' && (
            <Text className="mt-2 text-xs text-neutral-400">
              Enter as decimal (e.g. 5.9 for 5&apos;9&quot; roughly - refined input coming soon)
            </Text>
          )}
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
            onPress={handleFinish}
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
