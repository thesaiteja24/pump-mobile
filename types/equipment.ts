export type EquipmentType =
	| 'bodyweight'
	| 'dumbbells'
	| 'barbells'
	| 'kettlebells'
	| 'resistanceBands'
	| 'machines'
	| 'other'

export interface Equipment {
	id: string
	thumbnailUrl: string
	title: string
	type: EquipmentType | null
	createdAt: string
	updatedAt: string
}
