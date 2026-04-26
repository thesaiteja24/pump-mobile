import { Button } from '@/components/ui/buttons/Button'
import { useCreateHabit, useHabitsQuery, useUpdateHabit } from '@/hooks/queries/useHabits'
import {
  HabitColorScheme,
  HabitFooterType,
  HabitSourceType,
  HabitTrackingType,
  InternalMetricId,
  UpdateHabitPayload,
} from '@/types/habits'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  BackHandler,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

const COLORS: { name: HabitColorScheme; hex: string }[] = [
  { name: 'blue', hex: '#3b82f6' },
  { name: 'emerald', hex: '#10b981' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'rose', hex: '#f43f5e' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'orange', hex: '#f97316' },
]

const INTERNAL_METRICS: {
  id: InternalMetricId
  title: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { id: 'weight', title: 'Body Weight', label: 'Body Weight', icon: 'scale-outline' },
  { id: 'workout', title: 'Workout', label: 'Workout Frequency', icon: 'barbell-outline' },
  { id: 'bodyFat', title: 'Body Fat %', label: 'Body Fat %', icon: 'fitness-outline' },
  { id: 'waist', title: 'Waist Size', label: 'Waist Size', icon: 'body-outline' },
]

const OPTIONS = [
  { key: 'manual', label: 'Custom' },
  { key: 'internal', label: 'Internal Metric' },
] as const

export default function HabitCreatorScreen() {
  const { id } = useLocalSearchParams() as { id: string }
  const isEdit = !!id
  const navigation = useNavigation()

  // Habits from TanStack Query (includes pending queue items via merge)
  const { data: habits = [] } = useHabitsQuery()
  const habitToEdit = habits.find((h) => h.id === id)

  const [title, setTitle] = useState(habitToEdit?.title || '')
  const [selectedColor, setSelectedColor] = useState<HabitColorScheme>(
    habitToEdit?.colorScheme || 'emerald',
  )
  const [trackingType, setTrackingType] = useState<HabitTrackingType>(
    habitToEdit?.trackingType || 'streak',
  )
  const [source, setSource] = useState<HabitSourceType>(habitToEdit?.source || 'internal')
  const [internalMetricId, setInternalMetricId] = useState<InternalMetricId | null>(
    habitToEdit?.internalMetricId || null,
  )
  const [targetValue, setTargetValue] = useState(habitToEdit?.targetValue?.toString() || '')
  const [unit, setUnit] = useState(habitToEdit?.unit || '')
  const [footerType, setFooterType] = useState<HabitFooterType>(
    habitToEdit?.footerType || 'weeklyStreak',
  )

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()

  useEffect(() => {
    if (isEdit && habitToEdit) {
      setTitle(habitToEdit.title)
      setSelectedColor(habitToEdit.colorScheme)
      setTrackingType(habitToEdit.trackingType)
      setSource(habitToEdit.source)
      setInternalMetricId(habitToEdit.internalMetricId || null)
      setTargetValue(habitToEdit.targetValue?.toString() || '')
      setUnit(habitToEdit.unit || '')
      setFooterType(habitToEdit.footerType)
    }
  }, [isEdit, habitToEdit])

  const handleCreate = async () => {
    try {
      if (!title && source === 'manual') {
        Toast.show({ type: 'error', text1: 'Please enter a title' })
        return
      }

      if (trackingType === 'quantity' && !targetValue) {
        Toast.show({ type: 'error', text1: 'Please enter a goal value' })
        return
      }

      if (isEdit) {
        const updateData: UpdateHabitPayload = {
          title,
          colorScheme: selectedColor,
          footerType,
        }

        if (source === 'manual') {
          updateData.trackingType = trackingType
          updateData.targetValue = targetValue ? parseFloat(targetValue) : null
          updateData.unit = unit || null
        }

        await updateHabitMutation.mutateAsync({
          id,
          data: updateData,
        })
        router.back()
        return
      }

      await createHabitMutation.mutateAsync({
        title:
          source === 'internal'
            ? INTERNAL_METRICS.find((m) => m.id === internalMetricId)?.title || title
            : title,
        colorScheme: selectedColor,
        trackingType,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        unit: unit || null,
        footerType,
        source,
        internalMetricId,
      })

      router.back()
    } catch (error: any) {
      console.log('Create Habit Error:', error)

      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to create habit',
      })
    }
  }

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Habit' : 'Create Habit',
    })
  }, [isEdit, navigation])

  useEffect(() => {
    const onBackPress = () => {
      router.back()
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [])

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-white dark:bg-black">
      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={100}>
        {/* Scrollable Content */}
        <ScrollView
          contentContainerClassName="gap-4 p-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Source Toggle - Disabled in Edit Mode */}
          <View
            className={`flex-row rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900 ${isEdit ? 'opacity-50' : ''}`}
            pointerEvents={isEdit ? 'none' : 'auto'}
          >
            {OPTIONS.map((option) => {
              const isActive = source === option.key

              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    if (source !== option.key) {
                      setSource(option.key)
                    }
                  }}
                  className={`flex-1 items-center rounded-lg py-2 ${
                    isActive ? 'bg-white dark:bg-neutral-800' : ''
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      isActive ? 'text-black dark:text-white' : 'text-neutral-500'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* Manual / Internal Switch */}
          {source === 'manual' ? (
            <View className="gap-4">
              <Text className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Habit Details
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Drink Water"
                maxLength={16}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                placeholderTextColor="#888"
              />
            </View>
          ) : (
            <View className="gap-4">
              <Text className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                {isEdit ? 'Metric (Cannot be changed)' : 'Select Metric'}
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {INTERNAL_METRICS.map((m) => {
                  const isActive = internalMetricId === m.id
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => {
                        setInternalMetricId(m.id)
                        setTitle(m.label)
                        setSource('internal')
                        setTrackingType('streak')
                      }}
                      className={`flex-row items-center gap-2 rounded-xl border p-4 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                      }`}
                    >
                      <Ionicons
                        name={m.icon as any}
                        size={20}
                        color={isActive ? '#10b981' : '#888'}
                      />
                      <Text
                        className={`font-medium ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
                        }`}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {/* Color Scheme - Shared */}
          <View className="gap-4">
            <Text className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Color Scheme
            </Text>

            <View className="flex-row flex-wrap gap-4">
              {COLORS.map((c) => {
                const isActive = selectedColor === c.name
                return (
                  <Pressable
                    key={c.name}
                    onPress={() => setSelectedColor(c.name)}
                    style={{
                      backgroundColor: c.hex,
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      borderWidth: isActive ? 3 : 0,
                      borderColor: '#fff',
                    }}
                    className="items-center justify-center shadow"
                  >
                    {isActive && <Ionicons name="checkmark" size={24} color="white" />}
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Manual-Specific Options */}
          {source === 'manual' && (
            <View className="gap-4">
              {/* Tracking Type - Disabled in Edit Mode */}
              <View
                className={`gap-4 ${isEdit ? 'opacity-50' : ''}`}
                pointerEvents={isEdit ? 'none' : 'auto'}
              >
                <Text className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                  Tracking Type
                </Text>

                <View className="flex-row gap-4">
                  {['streak', 'quantity'].map((type) => {
                    const isActive = trackingType === type
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setTrackingType(type as any)}
                        className={`flex-1 items-center rounded-xl border p-4 ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                        }`}
                      >
                        <Ionicons
                          name={type === 'streak' ? 'flame-outline' : 'stats-chart-outline'}
                          size={24}
                          color={isActive ? '#10b981' : '#888'}
                        />
                        <Text
                          className={`mt-1 font-medium ${
                            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
                          }`}
                        >
                          {type === 'streak' ? 'Streak' : 'Quantity'}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Quantity Inputs */}
              {trackingType === 'quantity' && (
                <View className="flex-row gap-4">
                  <TextInput
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="4.0"
                    keyboardType="numeric"
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                  <TextInput
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="Liters"
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                </View>
              )}
            </View>
          )}

          {/* Footer (Always visible) */}
          <View className="gap-4">
            <Text className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Footer Option
            </Text>

            <View className="flex-row gap-4">
              {['weeklyStreak', 'weeklyCount'].map((type) => {
                const isActive = footerType === type
                return (
                  <Pressable
                    key={type}
                    onPress={() => setFooterType(type as HabitFooterType)}
                    className={`flex-1 items-center rounded-xl border p-4 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
                      }`}
                    >
                      {type === 'weeklyStreak' ? 'Weekly Streak' : 'Weekly Count'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-black">
          <Button title={isEdit ? 'Update Habit' : 'Create Habit'} onPress={handleCreate} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
