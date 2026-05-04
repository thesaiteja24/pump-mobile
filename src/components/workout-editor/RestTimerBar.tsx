import { useExercises } from '@/hooks/queries/exercises'
import {
  getRestTimerRemainingSeconds,
  useWorkoutEditor,
} from '@/stores/workout-editor.store'
import { formatSeconds } from '@/utils/workout'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const REST_TIMER_DONE_SOUND =
  'data:audio/wav;base64,UklGRmQLAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUALAAAAAGkAHgEMAa3/tP28/Af+SAF/BDIFSgIs/SL5O/kL/uMESAnhB/YAovhq9JT3sQAoCqUNUggL/eHyrvB5+MYFIBB9EAIG9Pb87PbuO/ysDKUV4xDYAH3vIegJ8LgCbRSOGTsOLfm+527lVPRfC9ob0BpPCMfv9eDN5dD7PRWvIasYY//A5WDcz+n/BRcfviTFEiv0a9wS25Px+BGNJxkkOwkP6DXWC9/j/K0cICquHPf8O99y1i7oFQklJBwoexIZ8UXZL9o4818Ueyi9ItgGoeal1hDhNP/OHVkpgBrF+m3eitd56hwLnSS4JiAQSO8m2dXblvXxFUAo3CCFBFblNtcg43EByh50KEwYq/jE3b3YxOwIDe8kPiXLDZXtK9mO3ej3YRfkJ+4eQQIv5OjXOOWZA6IfcicXFqv2QN0J2gzv1g4dJa8jfgsD7FTZV98u+rAYZif1HBAALOO32FXnqgVVIFYm4BPF9ODcbNtO8YcQKCUOIjwJkeqe2S7hZPzcGckm9Brz/Uzio9l26aMH5CAgJawR+vKk3OTcifMYEhAlXCAGBz/pCdoQ44j+5RoOJu0Y6/uQ4aral+uDCVAh1CN9D03xitxu3rv1ixPXJJwe3gQQ6JPa++SaAMwbNyXiFvr59uDJ27jtSAuZIXMiUw2975PcCeDi990UfiTRHMYCAuc62+zmmAKQHEUk1RQi+IDgAN3U7/EMwCH/IDMLTO683LLh+/kPFgYk/BrAABbm/tvi6H8EMh06I8gSY/Ys4Eve7PF+DsUheh8cCfnsBd1o4wX8IRdwIyAZzv5L5dzc2+pQBrIdGSK/EL70+d+q3/vz7g+rIecdEgfG62zdJ+X+/REYvyI/F/D8ouTT3dPsBwgQHuIgug428+bfGeEB9j8RcSFHHBYFsurx3e7m5f/hGPQhWxUp+xrk4d7K7qYJTh6YH7wMyfH035ji+/dyEhkhnRorA7/pkN676LcBkBkQIXYTefmz4wPgvPApC2wePh7HCnnwIOAi5On5hxOkIOoYUAHr6Erfi+p1Ax8aFSCSEeL3a+M54anykgxqHtQc3AhH72nguOXH+3wUFSAyF4n/N+gc4FzsHAWOGgUfsg9k9kPjgOKN9N4NSx5dG/4GM+7P4FbnlP1TFWwfdhXW/aPnBeEs7qsG3RrjHdgNAfU649bjZ/YODw4e3BkuBT3tT+H66FD/CharHrgTOPwt5wLi+u8iCA4brxwFDLnzTuM55Tb4IRC2HVIYbgNl7Onho+r4AKMW0x37EbH61+YT48PxgAkhG2wbOgqM8n7jp+b3+RcRRB3BFr8Bq+ub4k7siwIdF+ccPxBC+Z7mNOSF88MKFxscGnsIe/HK4x7oqvvvEbkcKxUjAA/rYuP57QgEehfoG4gO7PeD5mXlPvXrC/IawRjJBofwMOSb6Uz9qhIWHJMTmv6R6j7kou9vBbkX2BrXDK/2hOai5u72+AyxGl0XJQWw767kHuvc/kgTXRv7ESf9MOot5UfxvgbbF7gZLguL9aDm7OeR+OoNVxrxFZAD9O5D5aTsWQDJE5AaYxDK++zpLebn8vQH4heMGI8Jg/TX5j7pJ/rADuUZgRQNAlbu7uUr7sEBLRSxGc8Og/rD6TvngPQRCc4XVBf7B5TzJueY6q77eg9cGQ0TnADT7a3mse8VA3YUwBhADVX5tulY6A/2FQqgFxMWdAbB8o3n9+sk/RgQvhiXET7/be1+5zTxUgSjFMEXuAs++MPpf+mU9/4KWhfKFPsECfIL6Frtif6bEAwYIxD1/SHtYOiy8ngFthS1FjkKQffp6bDqDPnOC/wWfBOSA2zxnui+7tr/AxFIF7EOwvzx7FHpKvSHBq4UnRXDCF32KOro63f6gwyIFioSOgLq8ETpIvAYAVARcxZDDaX72uxP6pn1fQePFHwUWgeS9X3qJu3S+x4NABbWEPQAgvD86YPxQQKDEZAV2wue+tzsWOv/9lsIVxRTE/4F4fTn6mjuHf2eDWUVgw/C/zTwxOrh8lUDnRGgFHsKsPn37GrsWvghCQkUJBKwBEn0Zuus71b+BQ64FDEOo/4A8JvrOfRSBJ4RpRMlCdn4Ke2E7af5zQmmE/IQcwPL8/jr7/B9/1IO+xPjDJr95O9+7In1OQWIEaAS2Qca+HDtpO7n+mAKLxO9D0YCZ/Ob7DHykACHDjATmwum/OHvbO3R9ggGWhGUEZoGc/fN7cjvF/zaCqYSiQ4sARvzTu1w848Bow5YElkKyfv172TuDvjABhgRghBoBeX2Pe7t8Df9PAsMElYNJADn8g7uqfR4AqgOdhEhCQL7HvBj7z/5XwfBEGwPRQRw9r/uFPJF/oULYhEmDDH/y/Lc7tz1TAOWDooQ8gdS+l3waPBi+ugHVxBVDjMDEvZR7zjzQP+3C6sQ+wpS/sbys+8G9woEbg6XD9AGuvmw8HHxd/tYCNsPPA0yAsz18+9a9CgA0gvoD9cJiP3Y8pTwJvixBDIOng66BTj5FfF88n38sQhPDyUMQgGd9aLwdvX8ANYLGg+8CNT8/vJ88Tv5QgXiDaINsgTO+Izxh/Nx/fIItA4SC2YAhfVd8Yz2uwHEC0MOqQc2/DnzafJD+rsFgQ2jDLoDe/gT8pH0VP4dCQwOAwqd/4P1IvKa92UCngtlDaIGrvuG81rzPfsfBg4NpAvTAj/4qPKX9ST/MglZDfoI6f6W9fDyn/j6AmMLggyoBTz75vNO9Cj8awaLDKcK/AEZ+Erzmfbh/zEJmwz5B0r+vfXF85j5eQMXC5sLuwTh+lb0QfUD/aIG+wutCTgBCPj385X3igAcCdULAge//fj1nvSG+uIDuQqzCt0Dm/rV9DP2zP3CBl4LtwiHAA34rvSJ+B8B8ggICxYGSv1F9nz1Zfs1BEoKygkPA2z6YvUi94T+zQa2CscH6f8m+G31dPmfAbYINwo1Ber8o/Zb9jb8cgTNCeIIUgJR+vv1DPgp/8QGBArgBmD/Uvgz9lT6CgJoCGIJYgSg/BH3Ovf4/JoEQgn+B6YBTPqf9vD4u/+nBksJAQbr/pH4/fYn+2ACCQiMCJ4Da/yN9xf4qf2tBKwIHwcNAVv6TPfM+TkAdgaLCC0Fi/7i+Mr37vuhApsHtQfpAkz8Fvjy+Ej+rAQLCEYGhwB++gH4n/qjADQGxwdlBD/+QvmZ+Kb8zAIeB+EGRAJA/Kv4x/nV/pYEYQd1BRUAs/q8+Gf7+QDgBQAHqwMI/rL5aPlP/eMClQYPBrEBSvxL+Zb6T/9uBLAGrQS2//r6e/kk/DoBfAU4Bv8C5v0w+jT65/3mAgAGQwUwAWb88vld+7b/MgT5Be8DbP9S+z360/xmAQoFcAViAtj9uvr++m/+1QJiBX0EwgCW/KH6G/wJAOYDPgU+Azb/uvv/+nT9fgGKBKsE1QHf/U/7wvvk/rACuwTAA2cA2PxV+878SACJA4AEmgIU/zD8wfsF/oIB/gPpA1oB+f3u+3/8Rv95Ag4ECwMfACv9Dfx1/XMAHAPCAwQCBv+z/IH8hv5yAWcDLAPwACb+lfw0/Zb/LwJbA2IC6/+O/cj8D/6KAKICBQN+AQ3/Q/09/fb+TgHHAnYCmQBm/kL94P3S/9UBpQLFAcz/AP6C/Zr+jAAaAkoCCAEn/9z98/1U/xgBHwLJAVYAt/70/YD++v9rAe0BNQHA/4D+PP4W/3sAhwGUAaMAVf9//qL+n//PAHABJQElABr/qv4V/w4A8gA1AbMAyf8N//P+gf9WAOkA4wBQAJX/Kf9J/9j/dQC+AIwACQCL/2H/nP8OAGwAfgBBAOX/pf+l/9v/HgBDADkAEADo/9n/5v/9/woACAA='

export default function RestTimerBar() {
  const isDark = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const [now, setNow] = useState(Date.now())
  const [isHiddenAfterCompletion, setIsHiddenAfterCompletion] = useState(false)
  const completionPlayer = useAudioPlayer(REST_TIMER_DONE_SOUND)
  const lastCompletionKeyRef = useRef<string | null>(null)
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const workout = useWorkoutEditor((state) => state.workout)
  const pauseWorkout = Boolean(workout?.pausedAt)
  const pauseRestTimer = useWorkoutEditor((state) => state.pauseRestTimer)
  const resumeRestTimer = useWorkoutEditor((state) => state.resumeRestTimer)
  const stopRestTimer = useWorkoutEditor((state) => state.stopRestTimer)
  const adjustRestTimer = useWorkoutEditor((state) => state.adjustRestTimer)
  const startRestTimer = useWorkoutEditor((state) => state.startRestTimer)
  const { data: exerciseList = [] } = useExercises()

  const restTimer = workout?.restTimer ?? null

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!restTimer?.running) return

    setNow(Date.now())
    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [restTimer?.running])

  const remainingSeconds = useMemo(() => {
    if (!restTimer) return 0
    return getRestTimerRemainingSeconds(restTimer, now)
  }, [now, restTimer])

  const targetSet = restTimer?.targetSetId ? workout?.setsById[restTimer.targetSetId] ?? null : null
  const targetExercise = targetSet
    ? workout?.exercisesById[targetSet.exerciseInstanceId] ?? null
    : null
  const targetExerciseDetails = targetExercise
    ? exerciseList.find((exercise) => exercise.id === targetExercise.exerciseId) ?? null
    : null
  const configuredRestSeconds = targetSet?.restSeconds ?? restTimer?.seconds ?? 60
  const completionKey =
    restTimer?.targetSetId != null ? `${restTimer.targetSetId}:${restTimer.startedAt ?? 'idle'}` : null
  const isDone = Boolean(restTimer && restTimer.seconds === 0 && !restTimer.running)

  useEffect(() => {
    if (!restTimer?.running || remainingSeconds > 0) return

    if (completionKey && lastCompletionKeyRef.current === completionKey) return
    lastCompletionKeyRef.current = completionKey
    setIsHiddenAfterCompletion(true)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    completionPlayer.seekTo(0).catch(() => {})
    completionPlayer.play()

    const replayOne = setTimeout(() => {
      completionPlayer.seekTo(0).catch(() => {})
      completionPlayer.play()
    }, 800)

    const replayTwo = setTimeout(() => {
      completionPlayer.seekTo(0).catch(() => {})
      completionPlayer.play()
    }, 1600)

    completionTimeoutRef.current = setTimeout(() => {
      stopRestTimer()
      completionTimeoutRef.current = null
    }, 2400)

    return () => {
      clearTimeout(replayOne)
      clearTimeout(replayTwo)
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
        completionTimeoutRef.current = null
      }
    }
  }, [completionKey, completionPlayer, remainingSeconds, restTimer?.running, stopRestTimer])

  useEffect(() => {
    if (restTimer?.running) {
      lastCompletionKeyRef.current = null
      setIsHiddenAfterCompletion(false)
    }
  }, [restTimer?.running, restTimer?.startedAt, restTimer?.targetSetId])

  if (!restTimer || restTimer.seconds == null) return null
  if (isHiddenAfterCompletion) return null

  const statusLabel = pauseWorkout
    ? 'Workout Paused'
    : restTimer.running
      ? 'Counting Down'
      : isDone
        ? 'Done'
        : 'Paused'

  return (
    <View
      className="absolute left-4 right-4 rounded-3xl border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-800 dark:bg-black"
      style={{ bottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {targetExerciseDetails?.title
              ? `${targetExerciseDetails.title}${targetSet ? ` • Set ${targetSet.setIndex + 1}` : ''}`
              : statusLabel}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-black dark:text-white">
            {isDone ? 'Done' : formatSeconds(remainingSeconds)}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              adjustRestTimer(-15)
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900"
          >
            <Text className="text-sm font-semibold text-black dark:text-white">-15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              if (restTimer.running) {
                pauseRestTimer()
              } else if (isDone) {
                startRestTimer(configuredRestSeconds, restTimer.targetSetId)
              } else if (!pauseWorkout) {
                resumeRestTimer()
              }
            }}
            disabled={pauseWorkout && !restTimer.running}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              pauseWorkout && !restTimer.running ? 'bg-neutral-400' : 'bg-primary'
            }`}
          >
            <Ionicons
              name={restTimer.running ? 'pause' : isDone ? 'refresh' : 'play'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              startRestTimer(configuredRestSeconds, restTimer.targetSetId)
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900"
          >
            <MaterialCommunityIcons
              name="restart"
              size={20}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              adjustRestTimer(15)
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900"
          >
            <Text className="text-sm font-semibold text-black dark:text-white">+15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              stopRestTimer()
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950"
          >
            <Ionicons name="close" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
