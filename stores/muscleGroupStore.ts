import { zustandStorage } from '@/lib/storage'
import {
	createMuscleGroupService,
	deleteMuscleGroupService,
	getAllMuscleGroupsService,
	getMuscleGroupByIdService,
	updateMuscleGroupService,
} from '@/services/muscleGroupService'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type MuscleGroup = {
	id: string
	thumbnailUrl: string
	title: string
	createdAt: string
	updatedAt: string
}

type MuscleGroupState = {
	muscleGroupLoading: boolean
	muscleGroupList: Array<MuscleGroup>
	lastSyncedAt: number | null

	getAllMuscleGroups: () => Promise<void>
	getMuscleGroupById: (id: string) => Promise<any>
	createMuscleGroup: (data: FormData) => Promise<any>
	updateMuscleGroup: (id: string, data: FormData) => Promise<any>
	deleteMuscleGroup: (id: string) => Promise<any>
	resetState: () => void
}

const initialState = {
	muscleGroupLoading: false,
	muscleGroupList: [] as MuscleGroup[],
	lastSyncedAt: null as number | null,
}

export const useMuscleGroup = create<MuscleGroupState>()(
	persist(
		set => ({
			...initialState,

			getAllMuscleGroups: async () => {
				set({ muscleGroupLoading: true })
				try {
					const res = await getAllMuscleGroupsService()

					if (res.success) {
						set({
							muscleGroupList: res.data || [],
							lastSyncedAt: Date.now(),
						})
					}
					set({ muscleGroupLoading: false })
				} catch (error) {
					set({ muscleGroupLoading: false })
				}
			},

			getMuscleGroupById: async (id: string) => {
				set({ muscleGroupLoading: true })
				try {
					const res = await getMuscleGroupByIdService(id)

					set({ muscleGroupLoading: false })
					return res
				} catch (error) {
					set({ muscleGroupLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			createMuscleGroup: async (data: FormData) => {
				set({ muscleGroupLoading: true })
				try {
					const res = await createMuscleGroupService(data)

					set({ muscleGroupLoading: false })
					return res
				} catch (error) {
					set({ muscleGroupLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			updateMuscleGroup: async (id: string, data: FormData) => {
				set({ muscleGroupLoading: true })
				try {
					const res = await updateMuscleGroupService(id, data)
					set({ muscleGroupLoading: false })
					return res
				} catch (error) {
					set({ muscleGroupLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			deleteMuscleGroup: async (id: string) => {
				set({ muscleGroupLoading: true })
				try {
					const res = await deleteMuscleGroupService(id)

					set({ muscleGroupLoading: false })
					return res
				} catch (error) {
					set({ muscleGroupLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			resetState: () => set({ ...initialState }),
		}),
		{
			name: 'muscle-group-store',
			storage: zustandStorage,
			partialize: state => ({
				muscleGroupList: state.muscleGroupList,
				lastSyncedAt: state.lastSyncedAt,
			}),
		}
	)
)
