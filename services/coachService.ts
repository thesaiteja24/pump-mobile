import {
	COACH_ACTIVE_CONVERSATION_ENDPOINT,
	COACH_CONVERSATIONS_ENDPOINT,
	COACH_CONVERSATION_ENDPOINT,
	COACH_CONVERSATION_MESSAGES_ENDPOINT,
	COACH_SPEECH_ENDPOINT,
	COACH_TRANSCRIPTION_ENDPOINT,
} from '@/constants/urls'
import { handleApiResponse } from '@/utils/handleApiResponse'
import * as FileSystem from 'expo-file-system/legacy'
import client, { getAccessToken } from './api'

export async function startConversationService() {
	try {
		const res = await client.post(COACH_CONVERSATIONS_ENDPOINT)
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function deleteConversationService(id: string) {
	try {
		const res = await client.delete(COACH_CONVERSATION_ENDPOINT(id))
		return handleApiResponse(res)
	} catch (error: any) {
		const errData = error.response?.data
		throw new Error(errData?.message || error.message || 'Network error')
	}
}

export async function downloadSpeechService(ttsId: string) {
	try {
		const uri = `${FileSystem.cacheDirectory}speech-${ttsId}.mp3`
		const url = COACH_SPEECH_ENDPOINT(ttsId)

		let token = getAccessToken()
		let response = await FileSystem.downloadAsync(url, uri, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		})

		if (response.status === 401) {
			try {
				await getActiveConversationService()
			} catch (e) {
				console.log('Refresh trigger failed', e)
			}
			token = getAccessToken()
			response = await FileSystem.downloadAsync(url, uri, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			})
		}

		if (response.status !== 200) {
			throw new Error(`Download failed: ${response.status}`)
		}

		return response.uri
	} catch (error: any) {
		throw new Error(error.message || 'Download error')
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
