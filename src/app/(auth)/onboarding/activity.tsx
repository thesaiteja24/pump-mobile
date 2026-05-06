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

export default function OnboardingActivity() {
  const router = useRouter()
  const colors = useThemeColor()
  const { activityLevel, setActivityLevel } = useOnboarding()

  const levels = [
    {
      value: 'sedentary',
      title: 'Sedentary',
      desc: 'Desk job, minimal exercise, little day-to-day movement.',
    },
    {
      value: 'lightlyActive',
      title: 'Lightly Active',
      desc: 'Light exercise or sports 1-3 days a week.',
    },
    {
      value: 'moderatelyActive',
      title: 'Moderately Active',
      desc: 'Moderate exercise or sports 3-5 days a week.',
    },
    {
      value: 'veryActive',
      title: 'Very Active',
      desc: 'Hard exercise or sports 6-7 days a week.',
    },
    {
      value: 'athlete',
      title: 'Athlete',
      desc: 'Very hard exercise, physical job, processing 2-a-days.',
    },
  ]

  const handleNext = () => {
    if (!activityLevel) {
      Toast.show({
        type: 'error',
        text1: 'Please select your activity level',
      })
      return
    }

    router.push('/(auth)/onboarding/summary')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">
          How active are you?
        </Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          This multiplier helps calculate your Total Daily Energy Expenditure (TDEE). Select the one
          that matches your true day-to-day lifestyle.
        </Text>

        <View className="flex gap-4">
          {levels.map((lvl) => (
            <SelectableCard
              key={lvl.value}
              selected={activityLevel === lvl.value}
              onSelect={() => setActivityLevel(lvl.value as any)}
              title={lvl.title}
              className="flex-col items-start gap-1 p-4"
            >
              <Text
                className={`mt-1 w-full px-1 text-left text-sm ${activityLevel === lvl.value ? 'text-blue-800 dark:text-blue-200' : 'text-neutral-500 dark:text-neutral-400'}`}
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
