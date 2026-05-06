import WorkoutEditor from '@/components/workout-editor/WorkoutEditor'
import { Stack } from 'expo-router'
import React from 'react'

export default function WorkoutStartScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <WorkoutEditor />
    </>
  )
}
