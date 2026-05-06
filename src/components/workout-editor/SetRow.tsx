import RPESelectionModal from '@/components/workouts/modals/RPESelectionModal'
import SetTypeSelectionModal from '@/components/workouts/modals/SetTypeSelectionModal'
import { BaseModalHandle } from '@/components/ui/BaseModal'
import TimerDurationModal, {
  TimerDurationModalHandle,
} from '@/components/workouts/modals/TimerDurationModal'
import { useThemeColor } from '@/hooks/theme'
import { useWorkoutEditor } from '@/stores/workout-editor.store'
import type { ExerciseType } from '@/types/exercises'
import type { ExerciseRestMode } from '@/types/workouts'
import { useUnitConverter } from '@/hooks/useUnitConverter'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { ElapsedTime } from './ElapsedTime'

const SCREEN_WIDTH = Dimensions.get('window').width
const DELETE_REVEAL_WIDTH = SCREEN_WIDTH * 0.25
const COL_SET = 'w-[40%] flex-row items-center justify-evenly'
const COL_STD = 'w-[20%] flex-row items-center justify-evenly'
const COL_RPE = 'w-[20%] flex-row items-center justify-evenly'

const INPUT_STYLE_BASE = {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 4,
  textAlign: 'center' as const,
}

const INPUT_STYLE_ACTIVE = {
  backgroundColor: '#f5f5f5',
}

const INPUT_STYLE_ACTIVE_DARK = {
  backgroundColor: '#262626',
}

const INPUT_STYLE_COMPLETED = {
  backgroundColor: 'rgba(255,255,255,0.2)',
}

const EXERCISE_CAPABILITIES: Record<
  ExerciseType,
  { hasWeight: boolean; hasReps: boolean; hasDuration: boolean }
> = {
  weighted: { hasWeight: true, hasReps: true, hasDuration: false },
  assisted: { hasWeight: true, hasReps: true, hasDuration: false },
  repsOnly: { hasWeight: false, hasReps: true, hasDuration: false },
  durationOnly: { hasWeight: false, hasReps: false, hasDuration: true },
}

type Props = {
  setId: string
  exerciseType: ExerciseType
  exerciseRestMode: ExerciseRestMode
  notesExpanded?: boolean
}

function getSetTypeColor(type: string, setIndex: number, completed: boolean) {
  switch (type) {
    case 'warmup':
      return { style: completed ? 'text-white' : 'text-yellow-500', value: 'W' }
    case 'dropSet':
      return { style: completed ? 'text-white' : 'text-purple-500', value: 'D' }
    case 'failureSet':
      return { style: completed ? 'text-white' : 'text-red-600', value: 'F' }
    default:
      return { style: completed ? 'text-white' : 'text-primary', value: setIndex + 1 }
  }
}

function SetRow({
  setId,
  exerciseType,
  exerciseRestMode,
  notesExpanded = false,
}: Props) {
  const colors = useThemeColor()
  const isDark = useColorScheme() === 'dark'
  const lineHeight = Platform.OS === 'ios' ? undefined : 18
  const { hasWeight, hasReps, hasDuration } = EXERCISE_CAPABILITIES[exerciseType]
  const mode = useWorkoutEditor((state) => state.mode)

  const set = useWorkoutEditor((state) => state.workout?.setsById[setId] ?? null)
  const updateSet = useWorkoutEditor((state) => state.updateSet)
  const deleteSet = useWorkoutEditor((state) => state.deleteSet)
  const toggleSetCompleted = useWorkoutEditor((state) => state.toggleSetCompleted)
  const startSetTimer = useWorkoutEditor((state) => state.startSetTimer)
  const stopSetTimer = useWorkoutEditor((state) => state.stopSetTimer)
  const { formatWeight, toCanonicalWeight } = useUnitConverter()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [weightText, setWeightText] = useState('')
  const [repsText, setRepsText] = useState('')
  const [noteText, setNoteText] = useState('')

  const swipeableRef = useRef<SwipeableMethods>(null)
  const setTypeModalRef = useRef<BaseModalHandle>(null)
  const rpeModalRef = useRef<BaseModalHandle>(null)
  const restPickerRef = useRef<TimerDurationModalHandle>(null)
  const durationPickerRef = useRef<TimerDurationModalHandle>(null)
  const hasTriggeredHaptic = useRef(false)

  const isCompleted = set?.completed ?? false
  const isNoteOpen = notesExpanded
  const isTemplateMode = mode === 'template-create' || mode === 'template-edit'

  useEffect(() => {
    if (!set || isEditing || !hasWeight) return
    setWeightText(set.weight != null ? formatWeight(set.weight).toString() : '')
  }, [set, isEditing, hasWeight, formatWeight])

  useEffect(() => {
    if (!set || isEditing || !hasReps) return
    setRepsText(set.reps != null ? set.reps.toString() : '')
  }, [set, isEditing, hasReps])

  useEffect(() => {
    if (!set || isNoteOpen) return
    setNoteText(set.note ?? '')
  }, [set, isNoteOpen])

  const wrapperProps = useMemo(
    () => ({
      ref: swipeableRef,
      enabled: !isEditing && !isDeleting,
      overshootLeft: false,
      overshootRight: false,
      overshootFriction: 4,
      leftThreshold: 80,
      rightThreshold: DELETE_REVEAL_WIDTH,
      renderLeftActions: isTemplateMode
        ? undefined
        : () => (
            <View className="flex-1 items-start justify-center rounded-md bg-green-700 px-6">
              <Ionicons name="checkmark-circle" size={28} color="white" />
            </View>
          ),
      renderRightActions: () => (
        <TouchableOpacity
          onPress={() => {
            if (!set) return
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
            swipeableRef.current?.close()
            setIsDeleting(true)
            setTimeout(() => deleteSet(set.exerciseInstanceId, set.id), 220)
          }}
          className="items-end justify-center rounded-md bg-red-600 px-6"
        >
          <Ionicons name="trash" size={22} color="white" />
        </TouchableOpacity>
      ),
      onSwipeableOpen: (direction: 'left' | 'right') => {
        if (!set || hasTriggeredHaptic.current) return
        hasTriggeredHaptic.current = true

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

        if (!isTemplateMode && direction === 'right') {
          requestAnimationFrame(() => swipeableRef.current?.close())
          toggleSetCompleted(set.id)
        }
      },
      onSwipeableClose: () => {
        hasTriggeredHaptic.current = false
      },
    }),
    [deleteSet, isDeleting, isEditing, isTemplateMode, set, toggleSetCompleted],
  )

  if (!set) return null

  const currentDurationSeconds = set.durationStartedAt
    ? (set.durationSeconds ?? 0) +
      Math.max(0, Math.floor((Date.now() - set.durationStartedAt) / 1000))
    : (set.durationSeconds ?? 0)

  return (
    <View>
      <Swipeable {...wrapperProps}>
        <View className="relative overflow-hidden rounded-md">
          {!isTemplateMode && (
            <Animated.View
              entering={FadeIn.duration(120)}
              className="absolute inset-y-0 left-0 w-20 items-start justify-center bg-green-700 px-4"
            >
              <Ionicons name="checkmark-circle" size={22} color="white" />
            </Animated.View>
          )}

          <Animated.View
            entering={FadeIn.duration(120)}
            className="absolute inset-y-0 right-0 w-20 items-end justify-center bg-red-600 px-4"
          >
            <Ionicons name="trash" size={22} color="white" />
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(120)}
            exiting={FadeOut.duration(180)}
            style={{ height: 42 }}
            className={`flex-row items-center rounded-md ${
              isCompleted ? 'bg-green-600 dark:bg-green-600' : 'bg-white dark:bg-black'
            }`}
          >
            <View className={COL_SET}>
              <TouchableOpacity
                hitSlop={20}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setTypeModalRef.current?.present()
                }}
                className="mr-3"
              >
                <Text
                  className={`text-base font-medium ${
                    getSetTypeColor(set.setType, set.setIndex, isCompleted).style
                  }`}
                >
                  {getSetTypeColor(set.setType, set.setIndex, isCompleted).value}
                </Text>
              </TouchableOpacity>

              <Text
                className={`text-base font-medium ${
                  isCompleted ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                --
              </Text>
            </View>

            <View className={COL_STD}>
              {hasWeight ? (
                <TextInput
                  value={weightText}
                  keyboardType="decimal-pad"
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => {
                    setIsEditing(false)
                    const num = Number(weightText)
                    if (!Number.isNaN(num)) {
                      updateSet(set.id, {
                        weight:
                          weightText.trim().length === 0
                            ? undefined
                            : toCanonicalWeight(num),
                      })
                    }
                  }}
                  selectTextOnFocus
                  onChangeText={setWeightText}
                  placeholder="0"
                  placeholderTextColor={isCompleted ? '#ffffff' : '#737373'}
                  style={[
                    { width: '90%' },
                    { lineHeight },
                    INPUT_STYLE_BASE,
                    isCompleted
                      ? INPUT_STYLE_COMPLETED
                      : isDark
                        ? INPUT_STYLE_ACTIVE_DARK
                        : INPUT_STYLE_ACTIVE,
                  ]}
                  className={`text-center text-base font-medium ${
                    isCompleted ? 'text-white' : 'text-primary'
                  }`}
                />
              ) : (
                <View />
              )}
            </View>

            <View className={COL_STD}>
              {hasReps && (
                <TextInput
                  value={repsText}
                  keyboardType="number-pad"
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => {
                    setIsEditing(false)
                    const num = Number(repsText)
                    if (!Number.isNaN(num)) {
                      updateSet(set.id, { reps: repsText.trim().length === 0 ? undefined : num })
                    }
                  }}
                  selectTextOnFocus
                  onChangeText={setRepsText}
                  placeholder="0"
                  placeholderTextColor={isCompleted ? '#ffffff' : '#737373'}
                  style={[
                    { width: '90%' },
                    { lineHeight },
                    INPUT_STYLE_BASE,
                    isCompleted
                      ? INPUT_STYLE_COMPLETED
                      : isDark
                        ? INPUT_STYLE_ACTIVE_DARK
                        : INPUT_STYLE_ACTIVE,
                  ]}
                  className={`text-center text-base font-medium ${
                    isCompleted ? 'text-white' : 'text-primary'
                  }`}
                />
              )}

              {hasDuration && (
                <View className="flex flex-row items-center justify-center gap-2">
                  <TouchableOpacity
                    onPress={() =>
                      set.durationStartedAt ? stopSetTimer(set.id) : startSetTimer(set.id)
                    }
                  >
                    <MaterialCommunityIcons
                      name={set.durationStartedAt ? 'pause' : 'play'}
                      size={22}
                      color={isCompleted ? 'white' : colors.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => durationPickerRef.current?.present(currentDurationSeconds)}
                  >
                    <ElapsedTime
                      baseSeconds={set.durationSeconds}
                      runningSince={set.durationStartedAt}
                      textClassName={
                        isCompleted
                          ? 'text-base font-medium text-white'
                          : 'text-base font-medium text-primary'
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View className={COL_RPE}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  rpeModalRef.current?.present()
                }}
                className={`w-3/4 rounded-full px-3 py-1 ${
                  isCompleted
                    ? 'bg-white'
                    : set.rpe
                      ? 'bg-primary'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-center text-sm font-medium ${
                    isCompleted
                      ? 'text-black'
                      : set.rpe
                        ? 'text-white'
                        : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {set.rpe ?? 'RPE'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Swipeable>

      {exerciseRestMode === 'perSet' && (
        <TouchableOpacity
          onPress={() => restPickerRef.current?.present(set.restSeconds ?? 60)}
          className="flex-row items-center px-4 pt-2"
        >
          <View className="h-[1px] flex-1 bg-neutral-300 dark:bg-neutral-700" />
          <ElapsedTime
            baseSeconds={set.restSeconds}
            textClassName={`mx-3 text-base font-medium ${
              set.restSeconds == null ? 'text-neutral-500 dark:text-neutral-400' : 'text-blue-500'
            }`}
          />
          <View className="h-[1px] flex-1 bg-neutral-300 dark:bg-neutral-700" />
        </TouchableOpacity>
      )}

      {isNoteOpen && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className="rounded-md bg-white px-4 dark:bg-black"
        >
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            multiline
            placeholder="Add a note for this set..."
            placeholderTextColor="#9ca3af"
            className="text-base text-black dark:text-white"
            onBlur={() => {
              const trimmed = noteText.trim()
              if (trimmed !== (set.note ?? '')) {
                updateSet(set.id, { note: trimmed || undefined })
              }
            }}
            blurOnSubmit
            style={{ lineHeight }}
          />
        </Animated.View>
      )}

      <SetTypeSelectionModal
        ref={setTypeModalRef}
        currentType={set.setType}
        onSelect={(type) => {
          if (type !== set.setType) {
            updateSet(set.id, { setType: type })
          }
        }}
      />

      <RPESelectionModal
        ref={rpeModalRef}
        currentValue={set.rpe}
        onSelect={(value) => {
          updateSet(set.id, { rpe: value })
        }}
      />

      <TimerDurationModal
        ref={restPickerRef}
        title="Rest Timer"
        confirmText="Save"
        onConfirm={(seconds) => {
          updateSet(set.id, { restSeconds: seconds })
        }}
      />

      <TimerDurationModal
        ref={durationPickerRef}
        title="Set Duration"
        confirmText="Save"
        onConfirm={(seconds) => {
          updateSet(set.id, {
            durationSeconds: seconds,
            durationStartedAt: null,
          })
        }}
        onReset={() => {
          updateSet(set.id, {
            durationSeconds: undefined,
            durationStartedAt: null,
          })
        }}
      />
    </View>
  )
}

export default memo(SetRow)
