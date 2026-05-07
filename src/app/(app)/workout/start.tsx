import { Stack } from 'expo-router'
import React from 'react'

import WorkoutEditor from '@/components/workout-editor/WorkoutEditor'

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
