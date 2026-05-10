import { Stack } from 'expo-router'

export default function ExercisesLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="weight-chart" />
      <Stack.Screen name="volume-chart" />
      <Stack.Screen name="duration-chart" />
      <Stack.Screen name="reps-chart" />
    </Stack>
  )
}
