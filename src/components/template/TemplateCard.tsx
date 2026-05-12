import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { Link, router } from 'expo-router'
import { Text, View } from 'react-native'

import { BaseCard, Button } from '@/components/ui'
import { useWorkoutEditor } from '@/stores/workout-editor.store'
import { WorkoutTemplate } from '@/types/templates'

export function TemplateCard({ template }: { template: WorkoutTemplate }) {
  const initiateWorkout = useWorkoutEditor((state) => state.initiateWorkout)
  const discardWorkout = useWorkoutEditor((state) => state.discardWorkout)

  const previewExercises = template.exercises.slice(0, 3)
  const remaining = template.exercises.length - previewExercises.length

  const handleStart = () => {
    discardWorkout()
    initiateWorkout({ template })
    router.push('/(app)/workout/start')
  }

  return (
    <Link
      href={`/(app)/template/${template.id}`}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      asChild
    >
      <BaseCard className="h-44">
        <BaseCard.Header title={template.title} subtitle={`created by ${template.authorName}`} />

        <BaseCard.Content>
          <View className="mb-4 flex-1">
            {previewExercises.map((ex) => (
              <View key={ex.id} className="mb-2 flex-row items-center gap-2">
                <Image
                  source={ex.thumbnailUrl}
                  style={{ width: 32, height: 32, borderRadius: 999 }}
                  contentFit="cover"
                />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {ex.sets.length} sets of {ex.title || 'Exercise'}
                </Text>
              </View>
            ))}
            {remaining > 0 && (
              <Text className="text-xs text-neutral-500">+{remaining} more exercises</Text>
            )}
          </View>
        </BaseCard.Content>

        <BaseCard.Footer>
          <Button
            title="Use Template"
            onPress={(e) => {
              e.preventDefault()
              handleStart()
            }}
            variant="primary"
            className="w-full"
          />
        </BaseCard.Footer>
      </BaseCard>
    </Link>
  )
}
export default TemplateCard
