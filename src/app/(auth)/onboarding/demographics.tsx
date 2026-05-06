import { Button } from '@/components/ui/buttons/Button'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useThemeColor } from '@/hooks/theme'
import { useOnboarding } from '@/stores/me.store'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function OnboardingDemographics() {
  const router = useRouter()
  const colors = useThemeColor()
  const { gender, dateOfBirth, setGender, setDateOfBirth } = useOnboarding()

  const handleNext = () => {
    if (!gender) {
      Toast.show({
        type: 'error',
        text1: 'Please select your gender',
      })
      return
    }
    if (!dateOfBirth) {
      Toast.show({
        type: 'error',
        text1: 'Please select your date of birth',
      })
      return
    }

    // Validate Age (e.g. > 10 years old)
    const now = new Date()
    const age = now.getFullYear() - dateOfBirth.getFullYear()
    if (age < 10) {
      Toast.show({
        type: 'error',
        text1: 'You must be at least 10 years old.',
      })
      return
    }

    router.push('/(auth)/onboarding/metrics')
  }

  const handleBack = () => {
    router.back()
  }
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">About You</Text>
        <Text className="mb-8 text-neutral-500 dark:text-neutral-400">
          To calculate your stats accurately, we need to know a little about you.
        </Text>

        {/* Gender Section */}
        <Text className="mb-3 text-lg font-semibold text-black dark:text-white">Gender</Text>
        <View className="mb-8 flex-row items-center gap-4">
          <SelectableCard
            selected={gender === 'male'}
            onSelect={() => setGender('male')}
            title="Male"
            className="flex-1"
          />
          <SelectableCard
            selected={gender === 'female'}
            onSelect={() => setGender('female')}
            title="Female"
            className="flex-1"
          />
          <SelectableCard
            selected={gender === 'other'}
            onSelect={() => setGender('other')}
            title="Other"
            className="flex-1"
          />
        </View>

        {/* Date of Birth Section */}
        <Text className="mb-3 text-lg font-semibold text-black dark:text-white">Date of Birth</Text>
        <View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <DateTimePicker
            value={dateOfBirth || new Date(2000, 0, 1, 0, 0, 0, 0)}
            onUpdate={setDateOfBirth}
            isModal={true}
            dateOnly={true}
            title="Select Date of Birth"
            textClassName="text-lg text-black dark:text-white text-center"
          />
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
