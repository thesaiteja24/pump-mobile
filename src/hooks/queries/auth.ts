import { queryKeys } from '@/lib/queryKeys'
import { googleLoginService } from '@/services/auth.service'
import { useAuth } from '@/stores/auth.store'
import { User } from '@/types/me'
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

    onSuccess: async (data) => {
      const { accessToken, refreshToken, user } = data as {
        refreshToken: string
        accessToken: string
        user: User
      }

      if (accessToken && user) {
        // Update session store
        await setSession({ userId: user.id, accessToken, refreshToken })

        // Seed the user cache immediately
        qc.setQueryData(queryKeys.me.profile, user)
      }
    },
  })
}
