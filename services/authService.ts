import {
	GOOGLE_LOGIN_ENDPOINT,
	SEND_OTP_ENDPOINT as send_otp_endpoint,
	VERIFY_OTP_ENDPOINT as verify_otp_endpoint,
} from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

type SendOtpPayload = {
	countryCode: string
	phone: string
	resend: boolean
}

type VerifyOtpPayload = {
	countryCode: string
	phone: string
	otp: string
	privacyAccepted?: boolean
	privacyPolicyVersion?: string
}

export async function sendOtpService(payload: SendOtpPayload) {
	try {
		const res = await client.post(send_otp_endpoint, payload)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function verifyOtpService(payload: VerifyOtpPayload) {
	try {
		const res = await client.post(verify_otp_endpoint, payload)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function googleLoginService(
	idToken: string,
	privacyAccepted?: boolean,
	privacyPolicyVersion?: string | null
) {
	try {
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
