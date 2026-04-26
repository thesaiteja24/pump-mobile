import { Button } from '@/components/ui/buttons/Button'
import {
  DeleteConfirmModal,
  DeleteConfirmModalHandle,
} from '@/components/ui/modals/DeleteConfirmModal'
import {
  useActiveProgram,
  useDeleteProgram,
  useProgramById,
  useStartProgram,
} from '@/hooks/queries/programs'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useMemo, useRef } from 'react'
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'

import {
  StartProgramSheet,
  StartProgramSheetHandle,
} from '@/components/ui/modals/StartProgramSheet'
import {
  WorkoutDetailsModal,
  WorkoutDetailsModalHandle,
} from '@/components/ui/modals/WorkoutDetailsModal'
import ShimmerProgramDetails from '@/components/ui/shimmers/ShimmerProgramDetails'
import { ROLES } from '@/constants/roles'
import { useProfileQuery } from '@/hooks/queries/me'
import { useAuth } from '@/stores/auth.store'
import { SelfUser } from '@/types/me'

export default function ProgramTemplateDetails() {
  const params = useLocalSearchParams()
  const navigation = useNavigation()
  const { data: program, isLoading: programByIdLoading } = useProgramById(params.id as string)
  const { data: activeProgram } = useActiveProgram()
  const deleteProgramMutation = useDeleteProgram()
  const startProgramMutation = useStartProgram()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)
  const workoutDetailsModalRef = useRef<WorkoutDetailsModalHandle>(null)
  const startProgramSheetRef = useRef<StartProgramSheetHandle>(null)

  const handleConfirmStart = async (duration: number) => {
    if (!program?.id) return

    try {
      await startProgramMutation.mutateAsync({
        programId: program.id,
        duration: duration,
        startDate: new Date(),
      })

      startProgramSheetRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'Program Started!',
        text2: 'Redirecting to your workout dashboard...',
      })

      // Wait a bit for the animation and sync
      setTimeout(() => {
        router.push('/(app)/(tabs)/workout')
      }, 500)
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to start program',
        text2: error.message || 'Please try again',
      })
    }
  }

  const currentUserId = useAuth((s) => s.userId)
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null
  const userId = currentUserId
  const role = user?.role

  const rightIcons = useMemo(
    () =>
      userId === program?.createdBy && role === ROLES.systemAdmin
        ? [
            {
              name: 'create-outline',
              onPress: () =>
                router.push({
                  pathname: '/(app)/program',
                  params: { mode: 'edit', id: program?.id },
                }),
              color: '#3b82f6',
            },
            {
              name: 'trash',
              onPress: () => deleteModalRef.current?.present(),
              color: 'red',
            },
          ]
        : [],
    [userId, program?.createdBy, program?.id, role],
  )

  useEffect(() => {
    if (program) {
      navigation.setOptions({
        title: 'Program Preview',
        gestureEnabled: !isModalOpen,
        rightIcons: rightIcons,
      })
    }
  }, [navigation, program, isModalOpen, rightIcons])

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back()
      } else {
        router.push('/(app)/(tabs)/home')
      }
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isModalOpen) {
        e.preventDefault()
        workoutDetailsModalRef.current?.dismiss()
      }
    })

    return unsubscribe
  }, [navigation, isModalOpen])

  if (programByIdLoading) {
    return <ShimmerProgramDetails />
  }

  if (!program) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-neutral-500">Program template not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    )
  }

  return (
    <View className="relative flex-1 bg-white dark:bg-black">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text className="mb-2 text-3xl font-bold text-black dark:text-white">{program.title}</Text>
        {program.description ? (
          <Text className="mb-6 text-base text-neutral-600 dark:text-neutral-400">
            {program.description}
          </Text>
        ) : null}

        <Text className="mb-4 text-xl font-bold text-black dark:text-white">Full Schedule</Text>

        {program?.weeks?.map((week) => (
          <View key={week.id} className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-black dark:text-white">
              {week.name}
            </Text>
            <View className="gap-2">
              {week.days.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  activeOpacity={0.7}
                  onPress={() => workoutDetailsModalRef.current?.present(day)}
                  className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <View>
                    <Text className="text-base font-medium text-black dark:text-white">
                      {day.name}
                    </Text>
                    {day.isRestDay ? (
                      <Text className="mt-1 text-sm text-emerald-500">Rest Day</Text>
                    ) : (
                      <Text className="mt-1 text-sm text-blue-500">
                        {day.template?.title || 'No Template Linked'}
                      </Text>
                    )}
                  </View>
                  {!day.isRestDay && <Ionicons name="barbell-outline" size={24} color="#9ca3af" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-transparent p-4">
        <Button
          title="Start This Program"
          variant="primary"
          onPress={() => {
            startProgramSheetRef.current?.present()
          }}
          className="mb-4 min-h-[52px]"
          liquidGlass
        />
      </View>
      <DeleteConfirmModal
        ref={deleteModalRef}
        title="Delete Program"
        description="Are you sure you want to delete this program? This will not affect users already following it."
        confirmText="Delete"
        onConfirm={async () => {
          if (!program?.id) return

          await deleteProgramMutation.mutateAsync(program.id)
          Toast.show({ type: 'success', text1: 'Program deleted' })
          router.back()
        }}
        onCancel={() => {}}
      />

      <WorkoutDetailsModal ref={workoutDetailsModalRef} onOpenChange={setIsModalOpen} />

      <StartProgramSheet
        ref={startProgramSheetRef}
        program={program}
        activeProgram={activeProgram ?? null}
        onConfirm={handleConfirmStart}
        isLoading={startProgramMutation.isPending}
      />
    </View>
  )
}
