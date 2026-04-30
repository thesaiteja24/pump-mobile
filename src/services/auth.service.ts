import { GOOGLE_LOGIN_ENDPOINT } from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function googleLoginService(
  idToken: string,
  privacyAccepted?: boolean,
  privacyPolicyVersion?: string | null,
) {
  try {
    // console.log(idToken, privacyAccepted, privacyPolicyVersion)
    const res = await client.post(GOOGLE_LOGIN_ENDPOINT, {
      idToken,
      privacyAccepted,
      privacyPolicyVersion,
    })
    return handleApiResponse(res)
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
