import { Button } from '@/components/ui/buttons/Button'
import TemplateSelectionModal, {
  TemplateSelectionModalHandle,
} from '@/components/ui/modals/TemplateSelectionModal'
import { useCreateProgram, useProgramById, useUpdateProgram } from '@/hooks/queries/programs'
import { useTemplatesQuery } from '@/hooks/queries/templates'
import { useProgram } from '@/stores/programs.store'
import { WorkoutTemplate } from '@/types/templates'
import { DraftProgramDay, DraftProgramWeek } from '@/types/programs'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Crypto from 'expo-crypto'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function ProgramEditor() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const params = useLocalSearchParams()
  const isEditing = params.mode === 'edit'

  // Draft state (Zustand — pure UI)
  const draftProgram = useProgram((s) => s.draftProgram)
  const startDraftProgram = useProgram((s) => s.startDraftProgram)
  const updateDraftProgram = useProgram((s) => s.updateDraftProgram)
  const discardDraftProgram = useProgram((s) => s.discardDraftProgram)

  // Server data (TanStack Query)
  const { data: programData, isLoading: programsLoading } = useProgramById(
    params.id as string | undefined,
  )
  const createProgramMutation = useCreateProgram()
  const updateProgramMutation = useUpdateProgram()

  // Template store — write actions only; list comes from TanStack Query
  const { data: templates = [] } = useTemplatesQuery()
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const templateSelectionModalRef = useRef<TemplateSelectionModalHandle>(null)
  const [activeSelectionContext, setActiveSelectionContext] = useState<{
    weekIndex: number
    dayIndex: number
  } | null>(null)

  const isTemplatesSynced = useCallback(() => {
    if (!draftProgram) return true
    const templateIds = draftProgram.weeks
      .flatMap((w) => w.days)
      .map((d) => d.templateId)
      .filter(Boolean)

    // All templates from TQ have real server IDs; just verify they exist in the list
    return templateIds.every((id) => templates.some((t) => t.id === id))
  }, [draftProgram, templates])

  // Init Draft
  useEffect(() => {
    if (isEditing) {
      if (!params.id) {
        router.back()
        return
      }
      // Avoid infinite loop: only start draft if it's not already set for this ID
      if (draftProgram?.id === params.id) return
      if (programsLoading && !programData) return

      const existing = programData
      if (existing) {
        startDraftProgram(JSON.parse(JSON.stringify(existing)))
      } else {
        router.back()
      }
    } else {
      // For new program, only start if no draft exists
      if (!draftProgram || draftProgram.id !== '') {
        startDraftProgram()
      }
    }
  }, [isEditing, params.id, programData, startDraftProgram, draftProgram, programsLoading])

  const handleSave = useCallback(async () => {
    if (!draftProgram) return

    if (!draftProgram.title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Title required',
        text2: 'Please enter a name for your program.',
      })
      return
    }

    if (!isTemplatesSynced()) {
      Toast.show({
        type: 'info',
        text1: 'Syncing templates...',
        text2: 'Please wait until all templates are synced with the backend.',
      })
      return
    }

    setSaving(true)
    try {
      if (isEditing && draftProgram.id) {
        await updateProgramMutation.mutateAsync({ id: draftProgram.id, data: draftProgram })
      } else {
        await createProgramMutation.mutateAsync(draftProgram)
      }

      Toast.show({
        type: 'success',
        text1: isEditing ? 'Program updated' : 'Program created',
      })
      discardDraftProgram()
      requestAnimationFrame(() => {
        router.back()
      })
    } catch (error: any) {
      console.error('Error in program handleSave', error)
      Toast.show({
        type: 'error',
        text1: 'Save error',
        text2: error.message || 'An unexpected error occurred.',
      })
    } finally {
      setSaving(false)
    }
  }, [
    draftProgram,
    isEditing,
    createProgramMutation,
    updateProgramMutation,
    discardDraftProgram,
    isTemplatesSynced,
  ])

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Program' : 'New Program',
      onLeftPress: () => {
        discardDraftProgram()
        requestAnimationFrame(() => {
          router.back()
        })
      },
      headerBackButtonMenuEnabled: false,
      rightIcons: [
        {
          name: 'checkmark-done',
          onPress: saving ? undefined : handleSave,
          disabled: saving,
          color: 'green',
        },
      ],
    })
  }, [navigation, saving, isEditing, handleSave, discardDraftProgram])

  const addWeek = useCallback(() => {
    if (!draftProgram) return
    const newWeekIndex = draftProgram.weeks?.length || 0
    const newWeek: DraftProgramWeek = {
      id: '',
      programId: draftProgram.id || '',
      key: Crypto.randomUUID(),
      name: `Week ${newWeekIndex + 1}`,
      weekIndex: newWeekIndex,
      days: Array.from({ length: 7 }).map((_, i) => ({
        id: '',
        weekId: '',
        key: Crypto.randomUUID(),
        name: `Day ${i + 1}`,
        dayIndex: i,
        isRestDay: false,
        templateId: null,
      })),
    }
    updateDraftProgram({ weeks: [...(draftProgram.weeks || []), newWeek] })
  }, [draftProgram, updateDraftProgram])

  const updateDay = useCallback(
    (weekIndex: number, dayIndex: number, patch: Partial<DraftProgramDay>) => {
      if (!draftProgram?.weeks) return
      const newWeeks = [...draftProgram.weeks]
      newWeeks[weekIndex].days[dayIndex] = { ...newWeeks[weekIndex].days[dayIndex], ...patch }
      updateDraftProgram({ weeks: newWeeks })
    },
    [draftProgram, updateDraftProgram],
  )

  const removeWeek = useCallback(
    (weekIndex: number) => {
      if (!draftProgram?.weeks) return
      const newWeeks = [...draftProgram.weeks]
      newWeeks.splice(weekIndex, 1)
      // re-index weeks
      const reindexed = newWeeks.map((w, i) => ({
        ...w,
        weekIndex: i,
        name: `Week ${i + 1}`,
      }))
      updateDraftProgram({ weeks: reindexed })
    },
    [draftProgram, updateDraftProgram],
  )

  useEffect(() => {
    const onBackPress = () => {
      if (isModalOpen) {
        templateSelectionModalRef.current?.dismiss()
        return true
      }

      if (router.canGoBack()) {
        discardDraftProgram()
        router.back()
      } else {
        discardDraftProgram()
        router.push('/(app)/(tabs)/workout')
      }
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [isModalOpen, discardDraftProgram])

  if (isEditing && programsLoading && draftProgram?.id !== params.id) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Loading program...
        </Text>
      </View>
    )
  }

  if (!draftProgram) return null

  return (
    <BottomSheetModalProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
            {/* Header Inputs */}
            <View className="border-b border-neutral-200 p-4 dark:border-neutral-800">
              <TextInput
                value={draftProgram.title}
                onChangeText={(t) => updateDraftProgram({ title: t })}
                placeholder="Program Name e.g. Hypertrophy PPL"
                placeholderTextColor="#9ca3af"
                className="mb-2 text-xl font-semibold text-black dark:text-white"
              />
              <TextInput
                value={draftProgram.description}
                onChangeText={(t) => updateDraftProgram({ description: t })}
                placeholder="Description (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                className="mb-4 text-base text-neutral-600 dark:text-neutral-400"
              />

              {/* Program Settings */}
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Experience Level
                  </Text>
                  <View className="flex-row gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => updateDraftProgram({ experienceLevel: level })}
                        className={`rounded-full border px-3 py-1.5 ${
                          draftProgram.experienceLevel === level
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <Text
                          className={`text-xs capitalize ${
                            draftProgram.experienceLevel === level
                              ? 'font-semibold text-white'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View>
                <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Duration Options (Weeks)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[4, 6, 8, 10, 12, 16].map((weeks) => {
                    const currentOptions = draftProgram.durationOptions
                    const isSelected = currentOptions.includes(weeks)
                    return (
                      <TouchableOpacity
                        key={weeks}
                        onPress={() => {
                          if (isSelected) {
                            if (currentOptions.length > 1) {
                              updateDraftProgram({
                                durationOptions: currentOptions.filter((o) => o !== weeks),
                              })
                            }
                          } else {
                            updateDraftProgram({
                              durationOptions: [...currentOptions, weeks].sort((a, b) => a - b),
                            })
                          }
                        }}
                        className={`rounded-lg border px-3 py-1.5 ${
                          isSelected
                            ? 'border-neutral-800 bg-neutral-800 dark:border-neutral-200 dark:bg-neutral-200'
                            : 'border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            isSelected
                              ? 'font-semibold text-white dark:text-black'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {weeks}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>

            {/* Weeks & Days lists */}
            <View className="p-4">
              {draftProgram.weeks?.map((week, wIndex) => (
                <ProgramWeekItem
                  key={week.key}
                  week={week}
                  weekIndex={wIndex}
                  templates={templates}
                  onUpdateWeekName={(name) => {
                    const newW = [...draftProgram.weeks!]
                    newW[wIndex].name = name
                    updateDraftProgram({ weeks: newW })
                  }}
                  onRemoveWeek={() => removeWeek(wIndex)}
                  onUpdateDay={updateDay}
                  onSelectTemplate={(wIdx, dIdx) => {
                    setActiveSelectionContext({
                      weekIndex: wIdx,
                      dayIndex: dIdx,
                    })
                    setIsModalOpen(true)
                    templateSelectionModalRef.current?.present()
                  }}
                />
              ))}

              <Button
                title="Add Week"
                variant="primary"
                leftIcon={<Ionicons name="add" size={20} color="white" />}
                onPress={addWeek}
                className="mt-4"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <TemplateSelectionModal
          ref={templateSelectionModalRef}
          templates={templates}
          onClose={() => setIsModalOpen(false)}
          onSelect={(templateId) => {
            if (activeSelectionContext) {
              updateDay(activeSelectionContext.weekIndex, activeSelectionContext.dayIndex, {
                templateId,
              })
            }
          }}
        />
      </SafeAreaView>
    </BottomSheetModalProvider>
  )
}

/* ───── Memoized Sub-components ───── */

const ProgramDayItemComponent = ({
  day,
  weekIndex,
  dayIndex,
  templates,
  onUpdateDay,
  onSelectTemplate,
}: {
  day: DraftProgramDay
  weekIndex: number
  dayIndex: number
  templates: WorkoutTemplate[]
  onUpdateDay: (wIdx: number, dIdx: number, patch: Partial<DraftProgramDay>) => void
  onSelectTemplate: (wIdx: number, dIdx: number) => void
}) => {
  const selectedTemplateTitle = useMemo(() => {
    if (!day.templateId) return null
    return templates.find((t) => t.id === day.templateId)?.title || 'Template Not Found'
  }, [day.templateId, templates])

  return (
    <View className="mb-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-black">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="flex-1 font-medium text-black dark:text-white">{day.name}</Text>
      </View>

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-neutral-600 dark:text-neutral-400">Rest Day?</Text>
        <Switch
          value={day.isRestDay}
          onValueChange={(val) =>
            onUpdateDay(weekIndex, dayIndex, {
              isRestDay: val,
              templateId: val ? null : day.templateId,
            })
          }
        />
      </View>

      {!day.isRestDay && (
        <View className="mt-2">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Selected Template
          </Text>

          {day.templateId ? (
            <View className="mb-2 flex-row items-center justify-between rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
              <View className="mr-2 flex-1">
                <Text className="text-sm font-medium text-black dark:text-white" numberOfLines={1}>
                  {selectedTemplateTitle}
                </Text>
              </View>
              <Button
                title="Change"
                variant="secondary"
                className="!px-3 !py-1"
                onPress={() => onSelectTemplate(weekIndex, dayIndex)}
              />
            </View>
          ) : (
            <View className="mt-1 flex-row items-center justify-start gap-3">
              <Button
                title="Select Existing"
                variant="secondary"
                className="flex-1"
                onPress={() => onSelectTemplate(weekIndex, dayIndex)}
              />
              <Button
                title="Create New"
                variant="primary"
                className="flex-1"
                onPress={() => {
                  router.push({
                    pathname: '/(app)/template/editor',
                    params: {
                      context: 'program',
                      weekIndex,
                      dayIndex,
                    },
                  } as any)
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  )
}
const ProgramDayItem = React.memo(ProgramDayItemComponent)
ProgramDayItem.displayName = 'ProgramDayItem'

const ProgramWeekItemComponent = ({
  week,
  weekIndex,
  templates,
  onUpdateWeekName,
  onRemoveWeek,
  onUpdateDay,
  onSelectTemplate,
}: {
  week: DraftProgramWeek
  weekIndex: number
  templates: WorkoutTemplate[]
  onUpdateWeekName: (name: string) => void
  onRemoveWeek: () => void
  onUpdateDay: (wIdx: number, dIdx: number, patch: Partial<DraftProgramDay>) => void
  onSelectTemplate: (wIdx: number, dIdx: number) => void
}) => {
  return (
    <View className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="mr-4 flex-1">
          <TextInput
            value={week.name}
            onChangeText={onUpdateWeekName}
            className="mb-1 text-lg font-bold text-black dark:text-white"
          />
        </View>
        <TouchableOpacity onPress={onRemoveWeek}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>

      {week.days.map((day, dIdx) => (
        <ProgramDayItem
          key={day.key}
          day={day}
          weekIndex={weekIndex}
          dayIndex={dIdx}
          templates={templates}
          onUpdateDay={onUpdateDay}
          onSelectTemplate={onSelectTemplate}
        />
      ))}
    </View>
  )
}
const ProgramWeekItem = React.memo(ProgramWeekItemComponent)
ProgramWeekItem.displayName = 'ProgramWeekItem'
