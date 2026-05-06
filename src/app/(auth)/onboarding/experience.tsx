import { Button } from '@/components/ui/buttons/Button'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import { FitnessLevel } from '@/types/programs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingExperience() {
  const router = useRouter()
  const colors = useThemeColor()
  const { fitnessLevel, setFitnessLevel } = useOnboarding()

  const levels = [
    {
      value: 'beginner',
      title: 'Beginner',
      desc: 'New to resistance training or returning after a long break.',
    },
    {
      value: 'intermediate',
      title: 'Intermediate',
      desc: 'Consistent training for 6+ months. Familiar with fundamental exercises.',
    },
    {
      value: 'advanced',
      title: 'Advanced',
      desc: 'Years of consistent training. Close to natural potential.',
    },
  ]

  const handleNext = () => {
    if (!fitnessLevel) {
      Toast.show({
        type: 'error',
        text1: 'Please select your experience level',
      })
      return
    }

    router.push('/(auth)/onboarding/pace')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">
          What is your experience?
        </Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          This helps us calibrate and tailor your plan.
        </Text>

        <View className="flex gap-4">
          {levels.map((lvl) => (
            <SelectableCard
              key={lvl.value}
              selected={fitnessLevel === lvl.value}
              onSelect={() => setFitnessLevel(lvl.value as FitnessLevel)}
              title={lvl.title}
              className="flex-col items-start gap-1 p-4"
            >
              <Text
                className={`mt-1 w-full px-1 text-left text-sm ${fitnessLevel === lvl.value ? 'text-blue-800 dark:text-blue-200' : 'text-neutral-500 dark:text-neutral-400'}`}
              >
                {lvl.desc}
              </Text>
            </SelectableCard>
          ))}
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
