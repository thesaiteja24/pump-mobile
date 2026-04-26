import { queryKeys } from '@/lib/queryKeys'
import {
  deleteConversationService,
  getActiveConversationService,
  sendMessageService,
  startConversationService,
  transcribeMessageService,
} from '@/services/coach.service'
import { CoachMessage } from '@/types/coach'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Crypto from 'expo-crypto'

/**
 * useCoachConversation
 * Fetches the active coach conversation and formats messages.
 */
export function useCoachConversation() {
  return useQuery({
    queryKey: queryKeys.coach.conversation,
    queryFn: async () => {
      const active = await getActiveConversationService()
      if (!active) return null

      const messages: CoachMessage[] = active.messages.map((m: any) => ({
        id: Crypto.randomUUID(),
        role: m.role === 'assistant' ? 'coach' : 'user',
        text: m.content,
        thinking: false,
      }))

      return {
        id: active.id,
        messages,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * useStartCoachConversation
 */
export function useStartCoachConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startConversationService,
    onSuccess: (data) => {
      const messages: CoachMessage[] = [
        {
          id: Crypto.randomUUID(),
          role: 'coach',
          text: data.text,
          thinking: false,
        },
      ]
      queryClient.setQueryData(queryKeys.coach.conversation, {
        id: data.id,
        messages,
      })
    },
  })
}

/**
 * useDeleteCoachConversation
 */
export function useDeleteCoachConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteConversationService(id),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.coach.conversation, null)
    },
  })
}

/**
 * useSendCoachMessage
 */
export function useSendCoachMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, question }: { conversationId: string; question: string }) =>
      sendMessageService(conversationId, question),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.coach.conversation, (old: any) => {
        if (!old) return old
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: Crypto.randomUUID(),
              role: 'coach',
              text: data.text,
              thinking: false,
            },
          ],
        }
      })
    },
  })
}

/**
 * useTranscribeCoachVoice
 */
export function useTranscribeCoachVoice() {
  return useMutation({
    mutationFn: (data: FormData) => transcribeMessageService(data),
  })
}
