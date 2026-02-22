import EquipmentModal, { EquipmentModalHandle } from '@/components/exercises/EquipmentModal'
import ExerciseList from '@/components/exercises/ExerciseList'
import MuscleGroupModal, { MuscleGroupModalHandle } from '@/components/exercises/MuscleGroupModal'
import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'

import { ROLES as roles } from '@/constants/roles'
import { useAuth } from '@/stores/authStore'
import { useEquipment } from '@/stores/equipmentStore'
import { Exercise, useExercise } from '@/stores/exerciseStore'
import { useMuscleGroup } from '@/stores/muscleGroupStore'
import { useTemplate } from '@/stores/templateStore'
import { useWorkout } from '@/stores/workoutStore'

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import Fuse from 'fuse.js'

import React, { useEffect, useMemo, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

/* ───────────────── Chip (UI only) ───────────────── */

type ChipProps = {
	label: string
	onRemove: () => void
}

function Chip({ label, onRemove }: ChipProps) {
	const isDark = useColorScheme() === 'dark'

	return (
		<TouchableOpacity
			onPress={onRemove}
			className="h-12 w-full flex-row items-center justify-around rounded-2xl border border-neutral-200/60 bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800"
		>
			<Text className="text-lg font-semibold text-black dark:text-white">{label}</Text>
			<Ionicons name="close-circle" size={24} color={isDark ? '#737373' : '#a3a3a3'} />
		</TouchableOpacity>
	)
}

/* ───────────────── Screen ───────────────── */

export default function ExercisesScreen() {
	const lineHeight = Platform.OS === 'ios' ? 0 : 20
	const role = useAuth(s => s.user?.role)
	const safeAreaInsets = useSafeAreaInsets()
	const params = useLocalSearchParams()
	const context = (params.context as 'workout' | 'template') || 'workout' // Default to workout

	const replaceExerciseId = typeof params.replace === 'string' ? params.replace : null

	const isSelectionMode = params.mode === 'select'

	// Workout Store
	const addExercise = useWorkout(s => s.addExercise)
	const removeExercise = useWorkout(s => s.removeExercise)
	const replaceExercise = useWorkout(s => s.replaceExercise)
	const workout = useWorkout(s => s.workout)

	// Template Store
	const draftTemplate = useTemplate(s => s.draftTemplate)
	const addExerciseToDraft = useTemplate(s => s.addExerciseToDraft)
	const removeExerciseFromDraft = useTemplate(s => s.removeExerciseFromDraft)
	const replaceDraftExercise = useTemplate(s => s.replaceDraftExercise)

	// Equipment Store
	const equipmentList = useEquipment(s => s.equipmentList)
	const equipmentLoading = useEquipment(s => s.equipmentLoading)
	const getAllEquipment = useEquipment(s => s.getAllEquipment)

	// Muscle Group Store
	const muscleGroupList = useMuscleGroup(s => s.muscleGroupList)
	const muscleGroupLoading = useMuscleGroup(s => s.muscleGroupLoading)
	const getAllMuscleGroups = useMuscleGroup(s => s.getAllMuscleGroups)

	// Exercise Store
	const exerciseList = useExercise(s => s.exerciseList)
	const exerciseLoading = useExercise(s => s.exerciseLoading)
	const getAllExercises = useExercise(s => s.getAllExercises)
	const deleteExercise = useExercise(s => s.deleteExercise)

	const initialSelectedIds = useMemo(() => {
		if (context === 'template') {
			return new Set<string>(draftTemplate?.exercises.map(e => e.exerciseId) ?? [])
		}
		return new Set<string>(workout?.exercises.map(e => e.exerciseId) ?? [])
	}, [workout?.exercises, draftTemplate?.exercises, context])

	// Local, temporary selection buffer (UI only)
	const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(initialSelectedIds)

	const selectedExerciseIds = isSelectionMode ? tempSelectedIds : initialSelectedIds

	const selectedCount = selectedExerciseIds.size

	const [query, setQuery] = useState('')
	// const [showMuscleGroupsModal, setShowMuscleGroupsModal] = useState(false); // Removed

	const equipmentModalRef = React.useRef<EquipmentModalHandle>(null)
	const muscleGroupsModalRef = React.useRef<MuscleGroupModalHandle>(null)
	const deleteConfirmModalRef = React.useRef<DeleteConfirmModalHandle>(null)

	const [filter, setFilter] = useState({
		equipmentId: '',
		muscleGroupId: '',
	})

	const [deleteExerciseId, setDeleteExerciseId] = useState<{
		id: string
		title: string
	} | null>(null)

	/* ───────────────── Load data ───────────────── */

	useEffect(() => {
		if (!equipmentList.length) getAllEquipment()
		if (!muscleGroupList.length) getAllMuscleGroups()
		if (!exerciseList.length) getAllExercises()
	}, [exerciseList.length, muscleGroupList.length, equipmentList.length])

	/* ───────────────── Fuzzy search ───────────────── */

	const fuse = useMemo(() => {
		if (!exerciseList.length) return null

		return new Fuse(exerciseList, {
			keys: [
				{ name: 'title', weight: 0.7 },
				{ name: 'equipment.title', weight: 0.2 },
				{ name: 'primaryMuscleGroup.title', weight: 0.1 },
				{ name: 'secondaryMuscleGroups.title', weight: 0.1 },
			],
			threshold: 0.3,
			ignoreLocation: true,
		})
	}, [exerciseList])

	const filteredExercises = useMemo(() => {
		let data = exerciseList

		if (filter.equipmentId) {
			data = data.filter(e => e.equipment?.id === filter.equipmentId)
		}

		if (filter.muscleGroupId) {
			data = data.filter(
				e =>
					e.primaryMuscleGroup?.id === filter.muscleGroupId ||
					e.otherMuscleGroups?.some(m => m.id === filter.muscleGroupId)
			)
		}

		if (!fuse || query.trim() === '') return data

		const ids = new Set(fuse.search(query).map(r => r.item.id))
		return data.filter(e => ids.has(e.id))
	}, [exerciseList, filter, fuse, query])

	/* ───────────────── Handlers ───────────────── */

	const handleExercisePress = (exercise: Exercise) => {
		Haptics.selectionAsync()

		if (replaceExerciseId) {
			if (exercise.id !== replaceExerciseId && initialSelectedIds.has(exercise.id)) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
				Toast.show({
					type: 'error',
					text1: 'Duplicate Exercise',
					text2: 'This exercise is already in your workout.',
				})
				return
			}

			if (context === 'template') {
				replaceDraftExercise(replaceExerciseId, exercise.id)
			} else {
				replaceExercise(replaceExerciseId, exercise.id)
			}
			router.back()
			return
		}

		if (isSelectionMode) {
			setTempSelectedIds(prev => {
				const next = new Set(prev)

				if (next.has(exercise.id)) {
					next.delete(exercise.id)
				} else {
					next.add(exercise.id)
				}

				return next
			})
			return
		}

		router.push(`/(app)/exercises/${exercise.id}/(tabs)/summary`)
	}

	/* ───────────────── Render ───────────────── */

	return (
		<View style={{ paddingBottom: safeAreaInsets.bottom }} className="flex-1 bg-white px-4 pt-4 dark:bg-black">
			{/* Search */}
			<View className="mb-4">
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search exercises, equipment, muscles…"
					placeholderTextColor="#9CA3AF"
					className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
					style={{ lineHeight: lineHeight }}
				/>
			</View>

			{/* Filters */}
			<View className="mb-4 flex-row gap-4">
				<View className="flex-1">
					{filter.equipmentId ? (
						<Chip
							label={equipmentList.find(e => e.id === filter.equipmentId)?.title ?? 'Equipment'}
							onRemove={() => {
								setFilter(f => ({ ...f, equipmentId: '' }))
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
							}}
						/>
					) : (
						<Button
							title="Equipment"
							onPress={() => {
								equipmentModalRef.current?.present()
								Keyboard.dismiss
							}}
						/>
					)}
				</View>

				<View className="flex-1">
					{filter.muscleGroupId ? (
						<Chip
							label={muscleGroupList.find(m => m.id === filter.muscleGroupId)?.title ?? 'Muscle Groups'}
							onRemove={() => {
								setFilter(f => ({ ...f, muscleGroupId: '' }))
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
							}}
						/>
					) : (
						<Button
							title="Muscle Groups"
							onPress={() => {
								muscleGroupsModalRef.current?.present()
								Keyboard.dismiss()
							}}
						/>
					)}
				</View>
			</View>

			{/* Exercise list */}
			<ExerciseList
				loading={exerciseLoading}
				exercises={filteredExercises}
				isSelecting={isSelectionMode}
				isSelected={id => selectedExerciseIds.has(id)}
				onPress={handleExercisePress}
				onLongPress={exercise => {
					if (role !== roles.systemAdmin) return
					setDeleteExerciseId({ id: exercise.id, title: exercise.title })
					deleteConfirmModalRef.current?.present()
				}}
			/>

			{/* Bottom bar (selection mode) */}
			{isSelectionMode && !exerciseLoading && (
				<View className="flex-row items-center justify-between rounded-2xl border border-neutral-200/60 bg-neutral-100 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
					<TouchableOpacity
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
							router.back()
						}}
					>
						<Text className="text-lg font-semibold text-red-600">Cancel</Text>
					</TouchableOpacity>

					<Text className="text-lg font-semibold text-black dark:text-white">{selectedCount} selected</Text>

					<TouchableOpacity
						disabled={selectedCount === 0}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

							// Remove exercises that were unselected
							initialSelectedIds.forEach(id => {
								if (!tempSelectedIds.has(id)) {
									if (context === 'template') {
										removeExerciseFromDraft(id)
									} else {
										removeExercise(id)
									}
								}
							})

							// Add newly selected exercises
							tempSelectedIds.forEach(id => {
								if (!initialSelectedIds.has(id)) {
									if (context === 'template') {
										addExerciseToDraft(id)
									} else {
										addExercise(id)
									}
								}
							})

							router.back()
						}}
					>
						<Text
							className={`text-lg font-semibold ${
								selectedCount === 0 ? 'text-neutral-400' : 'text-green-600'
							}`}
						>
							Done
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Modals */}
			<EquipmentModal
				ref={equipmentModalRef}
				loading={equipmentLoading}
				enableCreate={role === roles.systemAdmin}
				equipment={equipmentList}
				onClose={() => {}}
				onSelect={item => {
					setFilter(f => ({ ...f, equipmentId: item.id }))
					equipmentModalRef.current?.dismiss()
				}}
				onLongPress={item => {
					if (role !== roles.systemAdmin) return
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
					equipmentModalRef.current?.dismiss()
					router.push(`/(app)/(system-admin)/equipment/${item.id}`)
				}}
				onCreatePress={() => {
					if (role !== roles.systemAdmin) return
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
					equipmentModalRef.current?.dismiss()
					router.push(`/(app)/(system-admin)/equipment/create`)
				}}
			/>

			<MuscleGroupModal
				ref={muscleGroupsModalRef}
				loading={muscleGroupLoading}
				enableCreate={role === roles.systemAdmin}
				muscleGroups={muscleGroupList}
				onClose={() => {}}
				onSelect={item => {
					setFilter(f => ({ ...f, muscleGroupId: item.id }))
					muscleGroupsModalRef.current?.dismiss()
				}}
				onLongPress={item => {
					if (role !== roles.systemAdmin) return
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
					muscleGroupsModalRef.current?.dismiss()
					router.push(`/(app)/(system-admin)/muscle-groups/${item.id}`)
				}}
				onCreatePress={() => {
					if (role !== roles.systemAdmin) return
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
					muscleGroupsModalRef.current?.dismiss()
					router.push(`/(app)/(system-admin)/muscle-groups/create`)
				}}
			/>

			<DeleteConfirmModal
				ref={deleteConfirmModalRef}
				title={deleteExerciseId ? `Delete "${deleteExerciseId.title}"?` : 'Delete Exercise?'}
				description="This exercise will be permanently removed."
				onCancel={() => setDeleteExerciseId(null)}
				onConfirm={async () => {
					if (!deleteExerciseId) return
					const res = await deleteExercise(deleteExerciseId.id)
					await getAllExercises()
					setDeleteExerciseId(null)

					Toast.show({
						type: res.success ? 'success' : 'error',
						text1: res.success ? 'Exercise deleted successfully' : 'Error deleting exercise',
						text2: res.message,
					})
				}}
			/>
		</View>
	)
}
