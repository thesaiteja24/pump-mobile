import { Redirect, useLocalSearchParams } from 'expo-router'
import React from 'react'

/**
 * reliable deep linking redirector.
 * This file exists solely to match the clean URL `pump.thesaiteja.dev/share/workout/:shareId`
 * and redirect it to the internal functional route `(app)/workout/share/:shareId`
 * where AuthGuard and other logic reside.
 */
export default function ShareWorkoutRedirect() {
	const { shareId } = useLocalSearchParams<{ shareId: string }>()

	// Use replace to avoid keeping this redirect in the history stack
	return <Redirect href={`/(app)/workout/share/${shareId}`} />
}
