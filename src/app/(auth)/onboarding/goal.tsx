import { Button } from '@/components/ui/buttons/Button'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingGoal() {
  const router = useRouter()
  const colors = useThemeColor()
  const { fitnessGoal, setFitnessGoal } = useOnboarding()

  const handleNext = () => {
    if (!fitnessGoal) {
      Toast.show({
        type: 'error',
        text1: 'Please select a primary goal',
      })
      return
    }
    router.push('/(auth)/onboarding/target')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">
          What&apos;s your primary goal?
        </Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          This helps us calibrate your daily energy requirements.
        </Text>

        <View className="flex gap-4">
          <SelectableCard
            selected={fitnessGoal === 'loseWeight'}
            onSelect={() => setFitnessGoal('loseWeight')}
            title="Lose Fat"
            className="p-4"
          />
          <SelectableCard
            selected={fitnessGoal === 'gainMuscle'}
            onSelect={() => setFitnessGoal('gainMuscle')}
            title="Gain Muscle"
            className="p-4"
          />
          {/* For MVP we stick to fat loss / muscle gain */}
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
