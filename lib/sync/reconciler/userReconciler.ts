import { updateUserDataService } from '@/services/userService'
import { UserMutation } from '../types'

/**
 * Process a user mutation
 */
export async function processUserMutation(mutation: UserMutation) {
	const { type, payload, userId } = mutation

	try {
		switch (type) {
			case 'UPDATE_USER':
			case 'UPDATE_PREFERENCES':
				return await updateUserDataService(userId, payload)

			default:
				return { success: false, error: 'Unknown mutation type' }
		}
	} catch (error) {
		return { success: false, error }
	}
}
