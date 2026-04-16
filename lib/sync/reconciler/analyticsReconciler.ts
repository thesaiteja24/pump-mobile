import {
	addMeasurementsService,
	updateFitnessProfileService,
	updateNutritionPlanService,
} from '@/services/analyticsService'
import { AnalyticsMutation } from '@/types/sync'

/**
 * Process an analytics mutation off the queue
 */
export async function processAnalyticsMutation(mutation: AnalyticsMutation) {
	const { type, payload, userId } = mutation

	try {
		switch (type) {
			case 'UPDATE_FITNESS_PROFILE':
				return await updateFitnessProfileService(userId, payload)

			case 'ADD_MEASUREMENT':
				if (payload.progressPics && payload.progressPics.length > 0) {
					const formData = new FormData()
					for (const [key, value] of Object.entries(payload)) {
						if (key !== 'progressPics' && value !== null && value !== undefined) {
							formData.append(key, value.toString())
						}
					}
					payload.progressPics.forEach(pic => {
						formData.append('progressPics', pic as any)
					})
					return await addMeasurementsService(userId, formData)
				}
				return await addMeasurementsService(userId, payload)

			case 'UPDATE_NUTRITION_PLAN':
				return await updateNutritionPlanService(userId, payload)

			default:
				return { success: false, error: 'Unknown mutation type' }
		}
	} catch (error) {
		return { success: false, error }
	}
}
