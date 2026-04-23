import { queryKeys } from '@/lib/queryKeys'
import { googleLoginService } from '@/services/authService'
import { useAuth } from '@/stores/authStore'
import { User } from '@/types/user'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useGoogleLoginMutation() {
	const qc = useQueryClient()
	const { setSession } = useAuth()

	return useMutation({
		mutationFn: async ({
			idToken,
			privacyAccepted,
			privacyPolicyVersion,
		}: {
			idToken: string
			privacyAccepted?: boolean
			privacyPolicyVersion?: string | null
		}) => {
			const res = await googleLoginService(idToken, privacyAccepted, privacyPolicyVersion)
			if (!res.success) {
				throw new Error(res.message || 'Login failed')
			}
			return res.data
		},

		onSuccess: async data => {
			const { accessToken, refreshToken, user } = data as {
				refreshToken: string
				accessToken: string
				user: User
			}

			if (accessToken && user) {
				// Update session store
				await setSession({ userId: user.id, accessToken, refreshToken })

				// Seed the user cache immediately
				qc.setQueryData(queryKeys.user.byId(user.id), user)
			}
		},
	})
}
