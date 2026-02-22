import { zustandStorage } from '@/lib/storage'
import {
	createEquipmentService,
	deleteEquipmentService,
	getAllEquipmentService,
	getEquipmentByIdService,
	updateEquipmentService,
} from '@/services/equipmentService'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Equipment = {
	id: string
	thumbnailUrl: string
	title: string
	createdAt: string
	updatedAt: string
}

type EquipmentState = {
	equipmentLoading: boolean
	equipmentList: Array<Equipment>
	lastSyncedAt: number | null

	getAllEquipment: () => Promise<void>
	getEquipmentById: (id: string) => Promise<any>
	createEquipment: (data: FormData) => Promise<any>
	updateEquipment: (id: string, data: FormData) => Promise<any>
	deleteEquipment: (id: string) => Promise<any>
	resetState: () => void
}

const initialState = {
	equipmentLoading: false,
	equipmentList: [] as Equipment[],
	lastSyncedAt: null as number | null,
}

export const useEquipment = create<EquipmentState>()(
	persist(
		set => ({
			...initialState,

			getAllEquipment: async () => {
				set({ equipmentLoading: true })
				try {
					const res = await getAllEquipmentService()

					if (res.success) {
						set({
							equipmentList: res.data || [],
							lastSyncedAt: Date.now(),
						})
					}
					set({ equipmentLoading: false })
				} catch (error) {
					set({ equipmentLoading: false })
				}
			},

			getEquipmentById: async (id: string) => {
				set({ equipmentLoading: true })
				try {
					const res = await getEquipmentByIdService(id)

					set({ equipmentLoading: false })
					return res
				} catch (error) {
					set({ equipmentLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			createEquipment: async (data: FormData) => {
				set({ equipmentLoading: true })
				try {
					const res = await createEquipmentService(data)

					set({ equipmentLoading: false })
					return res
				} catch (error) {
					set({ equipmentLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			updateEquipment: async (id: string, data: FormData) => {
				set({ equipmentLoading: true })
				try {
					const res = await updateEquipmentService(id, data)

					set({ equipmentLoading: false })
					return res
				} catch (error) {
					set({ equipmentLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			deleteEquipment: async (id: string) => {
				set({ equipmentLoading: true })
				try {
					const res = await deleteEquipmentService(id)

					set({ equipmentLoading: false })
					return res
				} catch (error) {
					set({ equipmentLoading: false })

					return {
						success: false,
						error: error,
					}
				}
			},

			resetState: () => set({ ...initialState }),
		}),
		{
			name: 'equipment-store',
			storage: zustandStorage,
			partialize: state => ({
				equipmentList: state.equipmentList,
				lastSyncedAt: state.lastSyncedAt,
			}),
		}
	)
)
