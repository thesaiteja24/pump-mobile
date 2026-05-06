import {
  useCoachConversation,
  useDeleteCoachConversation,
  useSendCoachMessage,
  useStartCoachConversation,
  useTranscribeCoachVoice,
} from '@/hooks/queries/coach'
import { downloadSpeechService } from '@/services/coach.service'

import { CoachState, type CoachMessage } from '@/types/coach'
import {
  AudioModule,
  RecorderState,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'
import * as Crypto from 'expo-crypto'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'

interface CoachVoice {
  conversationId: string | null
  messages: CoachMessage[]
  coachState: CoachState
  recorderState: RecorderState
  isPlaying: boolean
  isThinking: boolean
  recordedAudioUri: string | null
  isLoading: boolean

  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  startPlaying: (uri: string) => Promise<void>
  stopPlaying: () => Promise<void>
  clearRecording: () => void

  initializeConversation: () => Promise<void>
  startConversation: () => Promise<void>
  deleteConversation: () => Promise<void>
  sendVoiceMessage: () => Promise<void>
  clearMessages: () => void
}

export function useCoach(): CoachVoice {
  const { data: conversation, isLoading: isLoadingConv } = useCoachConversation()
  const startMutation = useStartCoachConversation()
  const deleteMutation = useDeleteCoachConversation()
  const sendMutation = useSendCoachMessage()
  const transcribeMutation = useTranscribeCoachVoice()

  const [coachState, setCoachState] = useState<CoachState>(CoachState.idle)
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<CoachMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  })
  const audioPlayer = useAudioPlayer()
  const recorderState = useAudioRecorderState(audioRecorder)
  const playerStatus = useAudioPlayerStatus(audioPlayer)
  const isPlaying = playerStatus.playing

  // Sync local messages with server state when it changes
  useEffect(() => {
    if (conversation?.messages) {
      setLocalMessages(conversation.messages)
    }
  }, [conversation?.messages])

  const startRecording = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync()
    if (!status.granted) {
      Alert.alert('Permission to access microphone was denied')
      return
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    })

    await audioRecorder.prepareToRecordAsync()
    audioRecorder.record()
    setCoachState(CoachState.recording)
  }

  const stopRecording = async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    })

    await audioRecorder.stop()
    const uri = audioRecorder.uri
    setCoachState(CoachState.stopped)
    setRecordedAudioUri(uri)
  }

  const startPlaying = async (uri: string) => {
    audioPlayer.replace(uri)
    audioPlayer.seekTo(0)
    audioPlayer.play()
  }

  const stopPlaying = async () => {
    audioPlayer.pause()
    audioPlayer.seekTo(0)
    setCoachState(CoachState.idle)
  }

  const clearRecording = () => {
    setRecordedAudioUri(null)
    setCoachState(CoachState.idle)
  }

  const initializeConversation = async () => {
    // useQuery handles initial fetch, but if we have no conversation, we might want to start one
    if (!isLoadingConv && !conversation) {
      await startConversation()
    }
  }

  const startConversation = async () => {
    const thinkingId = Crypto.randomUUID()
    setIsThinking(true)

    setLocalMessages((prev) => [
      ...prev,
      { id: thinkingId, role: 'coach', text: '', thinking: true },
    ])

    try {
      const data = await startMutation.mutateAsync()
      const audioUri = await downloadSpeechService(data.ttsId)
      await startPlaying(audioUri)
    } catch (e) {
      console.error(e)
      setLocalMessages((prev) => prev.filter((m) => m.id !== thinkingId))
    } finally {
      setIsThinking(false)
    }
  }

  const sendVoiceMessage = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
      await audioRecorder.stop()

      const uri = audioRecorder.uri
      if (!uri) return

      setCoachState(CoachState.stopped)
      setRecordedAudioUri(uri)

      const userMessageId = Crypto.randomUUID()
      setLocalMessages((prev) => [
        ...prev,
        { id: userMessageId, role: 'user', text: 'Sending...', thinking: true },
      ])

      setIsThinking(true)

      const formData = new FormData()
      formData.append('audioFile', {
        uri,
        name: `recording-${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any)

      const { text: transcription } = await transcribeMutation.mutateAsync(formData)

      // Update local state for transcription
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, text: transcription, thinking: false } : msg,
        ),
      )

      const coachThinkingId = Crypto.randomUUID()
      setLocalMessages((prev) => [
        ...prev,
        { id: coachThinkingId, role: 'coach', text: '', thinking: true },
      ])

      const { ttsId } = await sendMutation.mutateAsync({
        conversationId: conversation!.id,
        question: transcription,
      })

      // Audio playback
      const audioUri = await downloadSpeechService(ttsId)
      await startPlaying(audioUri)

      setIsThinking(false)
      setCoachState(CoachState.idle)
    } catch (error) {
      console.error('sendVoiceMessage error:', error)
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.thinking
            ? { ...msg, text: 'I couldn’t process that right now. Try again.', thinking: false }
            : msg,
        ),
      )
      setIsThinking(false)
      setCoachState(CoachState.idle)
    }
  }

  const clearMessages = () => {
    // Not strictly supported by backend yet, but we can clear locally
    setLocalMessages([])
  }

  const deleteConversation = async () => {
    if (!conversation?.id) return
    try {
      await deleteMutation.mutateAsync(conversation.id)
      setRecordedAudioUri(null)
      setLocalMessages([])
    } catch (error) {
      console.error('Error deleting conversation', error)
    }
  }

  return {
    conversationId: conversation?.id || null,
    messages: localMessages,
    coachState,
    recorderState,
    isPlaying,
    isThinking,
    recordedAudioUri,
    isLoading: isLoadingConv,

    startRecording,
    stopRecording,
    startPlaying,
    stopPlaying,
    clearRecording,

    initializeConversation,
    startConversation,
    deleteConversation,
    sendVoiceMessage,
    clearMessages,
  }
}
