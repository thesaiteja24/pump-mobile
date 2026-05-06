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

import { ConversationResponse } from '@/types/coach'

export async function startConversationService(): Promise<{
  id: string
  text: string
  ttsId: string
}> {
  try {
    const res = await client.post(COACH_CONVERSATIONS_ENDPOINT)
    const handled = handleApiResponse<{
      id: string
      text: string
      ttsId: string
    }>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function deleteConversationService(id: string): Promise<void> {
  try {
    const res = await client.delete(COACH_CONVERSATION_ENDPOINT(id))
    const handled = handleApiResponse<void>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function downloadSpeechService(ttsId: string): Promise<string> {
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
        console.error('Refresh trigger failed', e)
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

export async function transcribeMessageService(data: FormData): Promise<{ text: string }> {
  try {
    const res = await client.post(COACH_TRANSCRIPTION_ENDPOINT, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const handled = handleApiResponse<{ text: string }>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function sendMessageService(
  conversationId: string,
  question: string,
): Promise<{ text: string; ttsId: string }> {
  try {
    const res = await client.post(COACH_CONVERSATION_MESSAGES_ENDPOINT(conversationId), {
      question,
    })

    const handled = handleApiResponse<{ text: string; ttsId: string }>(res)
    if (!handled.success) throw new Error(handled.message || 'Request failed')
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}

export async function getActiveConversationService(): Promise<ConversationResponse | null> {
  try {
    const res = await client.get(COACH_ACTIVE_CONVERSATION_ENDPOINT)
    const handled = handleApiResponse<ConversationResponse>(res)
    if (!handled.success) return null
    return handled.data!
  } catch (error: any) {
    const errData = error.response?.data
    throw new Error(errData?.message || error.message || 'Network error')
  }
}
