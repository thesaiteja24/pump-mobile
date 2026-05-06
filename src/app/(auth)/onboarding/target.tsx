import { Button } from '@/components/ui/buttons/Button'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { TextInput } from '@/components/ui/TextInput'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingTarget() {
  const router = useRouter()
  const colors = useThemeColor()
  const {
    targetType,
    setTargetType,
    weightUnit,
    setTargetWeight,
    setTargetBodyFat,
    targetWeight,
    targetBodyFat,
  } = useOnboarding()

  const [inputValue, setInputValue] = useState(
    targetType === 'weight'
      ? targetWeight
        ? targetWeight.toString()
        : ''
      : targetBodyFat
        ? targetBodyFat.toString()
        : '',
  )

  const handleNext = () => {
    if (!targetType) {
      Toast.show({ type: 'error', text1: 'Please select what you would like to target' })
      return
    }

    const val = parseFloat(inputValue)
    if (!inputValue || isNaN(val) || val <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid target value' })
      return
    }

    if (targetType === 'weight') {
      setTargetWeight(val, weightUnit)
    } else {
      setTargetBodyFat(val)
    }

    router.push('/(auth)/onboarding/experience')
  }

  const handleBack = () => {
    router.back()
  }

  const handleTypeSwitch = (type: 'weight' | 'bodyFat') => {
    setTargetType(type)
    setInputValue('')

    if (type === 'weight') {
      setTargetBodyFat(0)
    } else {
      setTargetWeight(0, weightUnit)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">
          What would you like to target?
        </Text>

        <View className="my-6 flex-row gap-2">
          <SelectableCard
            title="Body Weight"
            selected={targetType === 'weight'}
            onSelect={() => handleTypeSwitch('weight')}
            className="flex-1"
          />
          <SelectableCard
            title="Body Fat %"
            selected={targetType === 'bodyFat'}
            onSelect={() => handleTypeSwitch('bodyFat')}
            className="flex-1"
          />
        </View>

        {targetType && (
          <View className="mb-8">
            <Text className="mb-3 text-lg font-semibold text-black dark:text-white">
              Set your target {targetType === 'weight' ? 'weight' : 'body fat percentage'}
            </Text>
            <TextInput
              placeholder="0.0"
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              containerClassName="mb-1"
              rightElement={
                <Text className="ml-2 font-medium text-neutral-400">
                  {targetType === 'weight' ? weightUnit.toUpperCase() : '%'}
                </Text>
              }
            />
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
