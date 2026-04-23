import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal, DeleteConfirmModalHandle } from '@/components/ui/DeleteConfirmModal'
import { PaywallModal, PaywallModalHandle } from '@/components/ui/PaywallModal'
import ExerciseGroupModal, { ExerciseGroupModalHandle } from '@/components/workout/ExerciseGroupModal'
import ExerciseRow from '@/components/workout/ExerciseRow'
import { FREE_TIER_LIMITS } from '@/constants/limits'
import { useExercises } from '@/hooks/queries/useExercises'
import { useMyProfileQuery } from '@/hooks/queries/useMe'
import {
	useCreateTemplateMutation,
	useTemplateByIdQuery,
	useTemplatesQuery,
	useUpdateTemplateMutation,
} from '@/hooks/queries/useTemplates'
import { useProgram } from '@/stores/programStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useTemplate } from '@/stores/templateStore'
import { DraftTemplate } from '@/types/template'
import { SelfUser } from '@/types/user'
import { ExerciseGroupType } from '@/types/workout'
import { Ionicons } from '@expo/vector-icons'
import { usePreventRemove } from '@react-navigation/native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Text, TextInput, View, useColorScheme } from 'react-native'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function TemplateEditor() {
	const isDark = useColorScheme() === 'dark'
	const safeAreaInsets = useSafeAreaInsets()
	const navigation = useNavigation()
	const params = useLocalSearchParams()
	const { data: userData } = useMyProfileQuery()
	const user = userData as SelfUser | null
	const preferredWeightUnit = user?.preferredWeightUnit ?? 'kg'
	const { data: exerciseList = [] } = useExercises()

	const isEditing = params.mode === 'edit'

	// TQ queries and mutations
	const { data: templates = [] } = useTemplatesQuery()
	const { data: templateFromQuery } = useTemplateByIdQuery(isEditing ? (params.id as string) : null)
	const createMutation = useCreateTemplateMutation()
	const updateMutation = useUpdateTemplateMutation()

	// Draft state
	const draftTemplate = useTemplate(s => s.draftTemplate)
	const startDraftTemplate = useTemplate(s => s.startDraftTemplate)
	const updateDraftTemplate = useTemplate(s => s.updateDraftTemplate)
	const discardDraftTemplate = useTemplate(s => s.discardDraftTemplate)
	const isPro = useSubscriptionStore(s => s.isPro)
	const reorderDraftExercises = useTemplate(s => s.reorderDraftExercises)
	const removeExerciseFromDraft = useTemplate(s => s.removeExerciseFromDraft)
	const addSetToDraft = useTemplate(s => s.addSetToDraft)
	const updateDraftSet = useTemplate(s => s.updateDraftSet)
	const removeSetFromDraft = useTemplate(s => s.removeSetFromDraft)
	const createDraftExerciseGroup = useTemplate(s => s.createDraftExerciseGroup)
	const removeDraftExerciseGroup = useTemplate(s => s.removeDraftExerciseGroup)
	const prepareTemplateForSave = useTemplate(s => s.prepareTemplateForSave)

	/* ───── Grouping State ───── */
	// const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // Removed
	const deleteModalRef = useRef<DeleteConfirmModalHandle>(null)
	const pruneConfirmModalRef = useRef<DeleteConfirmModalHandle>(null)
	const paywallModalRef = useRef<PaywallModalHandle>(null)

	const [groupingMode, setGroupingMode] = useState<{
		type: ExerciseGroupType
		sourceExerciseId: string
	} | null>(null)
	const [selectedGroupExerciseIds, setSelectedGroupExerciseIds] = useState<Set<string>>(new Set())
	// const [isMuscleGroupModalVisible, setIsMuscleGroupModalVisible] =
	//   useState(false); // Removed
	const exerciseGroupModalRef = useRef<ExerciseGroupModalHandle>(null)

	// Derive group map
	const groupMap = React.useMemo(() => {
		const map = new Map()
		draftTemplate?.exerciseGroups.forEach(g => map.set(g.id, g))
		return map
	}, [draftTemplate?.exerciseGroups])

	// Derived Map of exerciseId -> Exercise
	const exerciseMap = useMemo(() => new Map(exerciseList.map(e => [e.id, e])), [exerciseList])

	// Derived exercises for grouping modal
	const templateExercisesForGrouping = useMemo(() => {
		if (!draftTemplate || !groupingMode) return []

		return draftTemplate.exercises
			.map(we => {
				const ex = exerciseMap.get(we.exerciseId)
				if (!ex) return null

				return {
					id: we.id, // Use Template Item ID (UUID)
					title: ex.title,
					thumbnailUrl: ex.thumbnailUrl,
					selected: selectedGroupExerciseIds.has(we.id),
					disabled: Boolean(we.exerciseGroupId) && !selectedGroupExerciseIds.has(we.id),
				}
			})
			.filter((item): item is NonNullable<typeof item> => item !== null)
	}, [draftTemplate, groupingMode, selectedGroupExerciseIds, exerciseMap])

	const handleCreateGroup = (currentExerciseId: string, type: ExerciseGroupType) => {
		setGroupingMode({
			type,
			sourceExerciseId: currentExerciseId,
		})
		setSelectedGroupExerciseIds(new Set([currentExerciseId]))
		exerciseGroupModalRef.current?.present()
	}

	const handleConfirmExerciseGroup = () => {
		if (!groupingMode || selectedGroupExerciseIds.size < 2) return

		createDraftExerciseGroup(
			Array.from(selectedGroupExerciseIds),
			groupingMode.type // Pass the type here to match store signature
		)

		setGroupingMode(null)
		setSelectedGroupExerciseIds(new Set())
		exerciseGroupModalRef.current?.dismiss()
	}

	const [saving, setSaving] = useState(false)
	const [pruneMessage, setPruneMessage] = useState<string | null>(null)
	const [pendingSave, setPendingSave] = useState<any | null>(null)

	const buildPruneMessage = (pruneReport: { droppedExercises: number; droppedGroups: number }): string | null => {
		const parts: string[] = []

		if (pruneReport.droppedExercises > 0) {
			parts.push(
				`${pruneReport.droppedExercises} exercise${pruneReport.droppedExercises > 1 ? 's' : ''} (not found)`
			)
		}

		if (pruneReport.droppedGroups > 0) {
			parts.push(`${pruneReport.droppedGroups} group${pruneReport.droppedGroups > 1 ? 's' : ''} (invalid)`)
		}

		if (parts.length === 0) return null

		return `The following will be removed:\n• ${parts.join('\n• ')}`
	}

	const commitSave = useCallback(
		async (templateToSave: DraftTemplate) => {
			setSaving(true)
			try {
				let res: any
				if (isEditing && templateToSave.id) {
					res = await updateMutation.mutateAsync({ id: templateToSave.id, draft: templateToSave })
				} else {
					res = await createMutation.mutateAsync(templateToSave)
				}

				if (res?.success) {
					Toast.show({
						type: 'success',
						text1: isEditing ? 'Template updated' : 'Template created',
					})

					if (
						params.context === 'program' &&
						params.weekIndex !== undefined &&
						params.dayIndex !== undefined
					) {
						const draftProgram = useProgram.getState().draftProgram
						if (draftProgram && draftProgram.weeks) {
							const wIndex = Number(params.weekIndex)
							const dIndex = Number(params.dayIndex)
							const newWeeks = [...draftProgram.weeks]
							if (newWeeks[wIndex]?.days[dIndex]) {
								newWeeks[wIndex].days[dIndex].templateId = res.data?.id || templateToSave.clientId
								useProgram.getState().updateDraftProgram({ weeks: newWeeks })
							}
						}
					}

					discardDraftTemplate()
					router.back()
				} else {
					Toast.show({
						type: 'error',
						text1: 'Error',
						text2: 'Failed to save template',
					})
				}
			} catch (error: any) {
				console.error(error)
				Toast.show({
					type: 'error',
					text1: 'Error',
					text2: error?.message || 'Unexpected error occurred',
				})
			} finally {
				setSaving(false)
				setPruneMessage(null)
				setPendingSave(null)
			}
		},
		[
			isEditing,
			updateMutation,
			createMutation,
			discardDraftTemplate,
			params.context,
			params.weekIndex,
			params.dayIndex,
		]
	)

	const hasUnsavedChanges = (!!draftTemplate &&
		(draftTemplate.title.trim().length > 0 ||
			draftTemplate.notes?.trim().length ||
			draftTemplate.exercises.length > 0)) as boolean

	usePreventRemove(hasUnsavedChanges, () => {
		deleteModalRef.current?.present()
	})

	const isLimitHit = !isEditing && !isPro && templates.length >= FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES

	// Present the paywall immediately if a user bypasses the UI gate
	useEffect(() => {
		if (isLimitHit) {
			requestAnimationFrame(() => {
				paywallModalRef.current?.present()
			})
		}
	}, [isLimitHit])

	// Initialize draft on mount
	useEffect(() => {
		if (isEditing) {
			if (!params.id) {
				Toast.show({ type: 'error', text1: 'Error', text2: 'No template ID provided' })
				router.back()
				return
			}
			// Use TQ query result (already fetched) or fall back to templates list
			const existing = templateFromQuery ?? templates.find(t => t.id === params.id)
			if (existing) {
				startDraftTemplate(JSON.parse(JSON.stringify(existing)))
			} else {
				Toast.show({ type: 'error', text1: 'Error', text2: 'Template not found' })
				router.back()
				return
			}
		} else {
			if (!draftTemplate) {
				startDraftTemplate()
			}
		}
	}, [isEditing, params.id, templateFromQuery, templates, startDraftTemplate, draftTemplate])

	const handleCancel = useCallback(() => {
		if (draftTemplate && (draftTemplate.title || draftTemplate.exercises.length > 0)) {
			deleteModalRef.current?.present()
		} else {
			discardDraftTemplate()
			router.back()
		}
	}, [draftTemplate, discardDraftTemplate])

	const handleSave = useCallback(async () => {
		if (!draftTemplate) return

		if (!draftTemplate.title.trim()) {
			Toast.show({
				type: 'error',
				text1: 'Title required',
				text2: 'Please enter a name for your template.',
			})
			return
		}

		const exerciseCount = draftTemplate.exercises.length
		if (exerciseCount === 0) {
			Toast.show({
				type: 'error',
				text1: 'No exercises',
				text2: 'Add at least one exercise to your template.',
			})
			return
		}

		// Prepare template for save (validate and prune)
		const prepared = prepareTemplateForSave()
		if (!prepared) return

		const message = buildPruneMessage(prepared.pruneReport)

		if (message) {
			setPendingSave(prepared.template)
			setPruneMessage(message)
			return // Stop here, wait for confirmation
		}

		// No pruning → save immediately
		await commitSave(prepared.template as any)
	}, [draftTemplate, prepareTemplateForSave, commitSave])

	// Configure navigation header
	useEffect(() => {
		navigation.setOptions({
			title: isEditing ? 'Edit Template' : 'New Template',
			onLeftPress: () => {
				handleCancel()
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
	}, [navigation, draftTemplate, saving, isEditing, handleSave, handleCancel])

	useEffect(() => {
		if (pruneMessage) {
			pruneConfirmModalRef.current?.present()
		}
	}, [pruneMessage])

	if (!draftTemplate)
		return (
			<View className="flex-1 items-center justify-center bg-white dark:bg-black">
				<Text className="text-neutral-500">Loading...</Text>
			</View>
		)

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={100}
			>
				{/* Header Inputs */}
				<View className="border-b border-neutral-200 p-4 dark:border-neutral-800">
					<TextInput
						value={draftTemplate.title}
						onChangeText={t => updateDraftTemplate({ title: t })}
						placeholder="Template Name e.g. Upper Body A"
						placeholderTextColor="#9ca3af"
						className="mb-2 text-xl font-semibold text-black dark:text-white"
					/>
					<TextInput
						value={draftTemplate.notes}
						onChangeText={t => updateDraftTemplate({ notes: t || undefined })}
						placeholder="Notes (optional)"
						placeholderTextColor="#9ca3af"
						multiline
						className="max-h-20 text-base text-neutral-600 dark:text-neutral-400"
					/>
				</View>

				<DraggableFlatList
					data={draftTemplate.exercises}
					keyExtractor={item => item.id}
					contentContainerStyle={{ marginBottom: safeAreaInsets.bottom }}
					onDragEnd={({ data }) => reorderDraftExercises(data)}
					activationDistance={20}
					showsVerticalScrollIndicator={false}
					renderItem={({ item, drag, isActive }) => {
						const details = exerciseMap.get(item.exerciseId)
						if (!details) return null

						return (
							<ExerciseRow
								exercise={item}
								exerciseDetails={details}
								preferredWeightUnit={preferredWeightUnit}
								isTemplate
								isActive={isActive}
								isDragging={isActive}
								drag={drag}
								groupDetails={item.exerciseGroupId ? groupMap.get(item.exerciseGroupId) : null}
								onDeleteExercise={() => removeExerciseFromDraft(item.exerciseId)}
								onAddSet={addSetToDraft}
								onUpdateSet={updateDraftSet}
								onDeleteSet={removeSetFromDraft}
								onCreateSuperSet={() => handleCreateGroup(item.id, 'superSet')}
								onCreateGiantSet={() => handleCreateGroup(item.id, 'giantSet')}
								onRemoveExerciseGroup={() => {
									if (item.exerciseGroupId) removeDraftExerciseGroup(item.exerciseGroupId)
								}}
								onReplaceExercise={() => {
									router.push({
										pathname: '/(app)/exercises',
										params: {
											mode: 'select',
											context: 'template',
											replace: item.exerciseId,
										},
									})
								}}
								onSaveRestPreset={(exerciseId, setId, seconds) =>
									updateDraftSet(exerciseId, setId, {
										restSeconds: seconds,
									})
								}
							/>
						)
					}}
					ListEmptyComponent={
						<View className="items-center justify-center p-8">
							<Text className="text-lg text-neutral-400">No exercises added yet.</Text>
						</View>
					}
					ListFooterComponent={
						<View className="mb-[50%] p-4">
							<Button
								title="Add Exercises"
								variant="outline"
								onPress={() => {
									router.push({
										pathname: '/(app)/exercises',
										params: { mode: 'select', context: 'template' },
									})
								}}
								leftIcon={<Ionicons name="add" size={20} color={isDark ? 'white' : 'black'} />}
							/>
						</View>
					}
				/>
			</KeyboardAvoidingView>

			<ExerciseGroupModal
				ref={exerciseGroupModalRef}
				exercises={templateExercisesForGrouping}
				onSelect={exercise => {
					if (!exercise || exercise.disabled) return

					setSelectedGroupExerciseIds(prev => {
						const next = new Set(prev)

						// Deselect if already selected
						if (next.has(exercise.id)) {
							if (exercise.id === groupingMode?.sourceExerciseId) {
								return prev
							}
							next.delete(exercise.id)
							return next
						}

						// For supersets, limit to 2 exercises
						if (groupingMode?.type === 'superSet' && next.size >= 2) {
							return prev
						}

						// Select exercise
						next.add(exercise.id)
						return next
					})
				}}
				onConfirm={handleConfirmExerciseGroup}
				onClose={() => {
					setGroupingMode(null)
					setSelectedGroupExerciseIds(new Set())
				}}
			/>

			<DeleteConfirmModal
				ref={deleteModalRef}
				title="Discard Changes?"
				description="You have unsaved changes. Are you sure you want to discard them?"
				onConfirm={() => {
					discardDraftTemplate()
					router.back()
				}}
				confirmText="Discard"
				onCancel={() => {}}
			/>

			{/* Prune Confirmation Modal */}
			<DeleteConfirmModal
				ref={pruneConfirmModalRef}
				title="Confirm Save"
				description={pruneMessage || ''}
				onConfirm={async () => {
					if (pendingSave) {
						await commitSave(pendingSave)
					}
				}}
				confirmText="Save Anyway"
				onCancel={() => {
					setPruneMessage(null)
					setPendingSave(null)
				}}
			/>

			<PaywallModal
				ref={paywallModalRef}
				title="Upgrade to Pro"
				description={`You can only add up to ${FREE_TIER_LIMITS.MAX_CUSTOM_TEMPLATES} custom templates on the Free plan.`}
				continueText="View Plans"
				cancelText="Go Back"
				onContinue={() => {
					discardDraftTemplate() // Cleanup in case they were drafting
					router.replace('/paywall')
				}}
				onCancel={() => {
					// Discard the draft and navigate back when limit is enforced
					discardDraftTemplate()
					router.back()
				}}
			/>
		</SafeAreaView>
	)
}
