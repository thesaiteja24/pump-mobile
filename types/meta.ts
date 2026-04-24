export type EquipmentType =
	| 'bodyweight'
	| 'dumbbells'
	| 'barbells'
	| 'kettlebells'
	| 'resistanceBands'
	| 'machines'
	| 'other'

export type MetaResource = 'equipment' | 'muscle-groups'

export interface MetaItem {
	id: string
	title: string
	thumbnailUrl: string
	type?: EquipmentType // Optional, only for equipment
	tags?: string[] // Optional, only for Muscle Groups
	createdAt: string
	updatedAt: string
}
