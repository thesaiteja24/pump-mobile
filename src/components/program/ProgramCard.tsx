import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Link, router } from 'expo-router'
import { View } from 'react-native'

import { BaseCard, Button } from '@/components/ui'
import { Program } from '@/types/programs'

export function ProgramCard({ program }: { program: Program }) {
  const handleStart = () => {
    router.push(`/(app)/program/${program.id}`)
  }

  return (
    <Link
      href={`/(app)/program/${program.id}`}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      asChild
    >
      <BaseCard className="h-48">
        <BaseCard.Header
          title={program.title}
          subtitle={program.description || undefined}
          className="mb-0"
        />

        <BaseCard.Footer className="mt-auto justify-between">
          <View className="flex-row items-center gap-2">
            <BaseCard.Badge
              label={program.experienceLevel}
              variant={
                program.experienceLevel === 'beginner'
                  ? 'success'
                  : program.experienceLevel === 'intermediate'
                    ? 'warning'
                    : 'error'
              }
            />
            <BaseCard.Badge label={`${program.enrolledCountLabel} enrolled`} variant="purple" />
          </View>

          <Button
            title=""
            onPress={(e) => {
              e.preventDefault()
              handleStart()
            }}
            rightIcon={<MaterialCommunityIcons name="chevron-right" size={24} color="white" />}
            variant="primary"
            className="rounded-full"
          />
        </BaseCard.Footer>
      </BaseCard>
    </Link>
  )
}
export default ProgramCard
