import {
	COACH_ACTIVE_CONVERSATION_ENDPOINT,
	COACH_CONVERSATIONS_ENDPOINT,
	COACH_CONVERSATION_MESSAGES_ENDPOINT,
	COACH_SPEECH_ENDPOINT,
	COACH_TRANSCRIPTION_ENDPOINT,
} from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import client from './api'

export async function startConversationService() {
	try {
		const res = await client.post(COACH_CONVERSATIONS_ENDPOINT)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function streamSpeechService(id: string) {
	try {
		const res = await client.get(COACH_SPEECH_ENDPOINT(id))
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function transcribeMessageService(data: FormData) {
	try {
		const res = await client.post(COACH_TRANSCRIPTION_ENDPOINT, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		})

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function sendMessageService(conversationId: string, question: string) {
	try {
		const res = await client.post(COACH_CONVERSATION_MESSAGES_ENDPOINT(conversationId), { question })

		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function getActiveConversationService() {
	try {
		const res = await client.get(COACH_ACTIVE_CONVERSATION_ENDPOINT)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}
