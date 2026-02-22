import { COACH_SPEECH_ENDPOINT } from '@/constants/urls'
import {
	getActiveConversationService,
	sendMessageService,
	startConversationService,
	transcribeMessageService,
} from '@/services/coachService'

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

enum CoachState {
	idle,
	recording,
	stopped,
}

export interface CoachMessage {
	id: string
	role: 'coach' | 'user'
	text: string
	thinking: boolean
}

interface CoachVoice {
	conversationId: string | null
	messages: CoachMessage[]
	coachState: CoachState
	recorderState: RecorderState
	isPlaying: boolean
	isThinking: boolean
	recordedAudioUri: string | null

	startRecording: () => Promise<void>
	stopRecording: () => Promise<void>
	startPlaying: (uri: string) => Promise<void>
	stopPlaying: () => Promise<void>
	clearRecording: () => void

	initializeConversation: () => Promise<void>
	startConversation: () => Promise<void>
	sendVoiceMessage: () => Promise<void>
	clearMessages: () => void
}

export const mockAskQuestionService = async (audioUri: string) => {
	// simulate network + processing time
	await new Promise(res => setTimeout(res, 1200))

	return {
		success: true,
		data: {
			text: "Alright, I heard you. Let's push one more set — controlled reps.",
		},
	}
}

export function useCoach(): CoachVoice {
	const [conversationId, setConversationId] = useState<string | null>(null)
	const [coachState, setCoachState] = useState<CoachState>(CoachState.idle)
	const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null)
	const [messages, setMessages] = useState<CoachMessage[]>([])
	const [isThinking, setIsThinking] = useState(false)

	const audioRecorder = useAudioRecorder({
		...RecordingPresets.HIGH_QUALITY,
		isMeteringEnabled: true,
	})
	const audioPlayer = useAudioPlayer()
	const recorderState = useAudioRecorderState(audioRecorder)
	const playerStatus = useAudioPlayerStatus(audioPlayer)
	const isPlaying = playerStatus.playing

	// Function to start recording the audio
	const startRecording = async () => {
		await setAudioModeAsync({
			playsInSilentMode: true,
			allowsRecording: true,
		})

		await audioRecorder.prepareToRecordAsync()
		audioRecorder.record()
		setCoachState(CoachState.recording)
	}

	// Function to stop recording the audio
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

	// Function to clear the recorded audio
	const startPlaying = async (uri: string) => {
		console.log('Playing audio from:', uri)
		audioPlayer.replace(uri)
		audioPlayer.seekTo(0)
		audioPlayer.play()
	}

	// Function to stop playing the audio
	const stopPlaying = async () => {
		audioPlayer.pause()
		audioPlayer.seekTo(0)
		setCoachState(CoachState.idle)
	}

	// Function to clear the recorded audio
	const clearRecording = () => {
		setRecordedAudioUri(null)
		setCoachState(CoachState.idle)
	}

	const initializeConversation = async () => {
		try {
			const active = await getActiveConversationService()

			if (active?.data?.id) {
				setConversationId(active.data.id)

				const restoredMessages = active.data.messages.map((m: any) => ({
					id: Crypto.randomUUID(),
					role: m.role === 'assistant' ? 'coach' : 'user',
					text: m.content,
					thinking: false,
				}))

				setMessages(restoredMessages)
				return
			}

			await startConversation()
		} catch (err) {
			console.log('init conversation failed', err)
		}
	}

	const startConversation = async () => {
		const thinkingId = Crypto.randomUUID()

		// insert thinking placeholder
		setMessages(prev => [
			...prev,
			{
				id: thinkingId,
				role: 'coach',
				text: '',
				thinking: true,
			},
		])

		try {
			const response = await startConversationService()

			if (!response.success) {
				setIsThinking(false)
				return
			}

			const { text, ttsId } = response.data

			// 1. show message instantly
			setMessages(prev => prev.map(msg => (msg.id === thinkingId ? { ...msg, text, thinking: false } : msg)))

			// 2. fetch audio
			const audioUri = COACH_SPEECH_ENDPOINT(ttsId)
			startPlaying(audioUri)
		} catch (e) {
			console.log(e)
			setIsThinking(false)
		}
	}

	const sendVoiceMessage = async () => {
		try {
			// 1️⃣ Stop recording safely
			await setAudioModeAsync({
				playsInSilentMode: true,
				allowsRecording: false,
			})

			await audioRecorder.stop()

			const uri = audioRecorder.uri
			if (!uri) return

			setCoachState(CoachState.stopped)
			setRecordedAudioUri(uri)

			// 2️⃣ Temporary user message while uploading
			const userMessageId = Crypto.randomUUID()

			setMessages(prev => [
				...prev,
				{
					id: userMessageId,
					role: 'user',
					text: 'Sending...',
					thinking: true,
				},
			])

			setIsThinking(true)

			// 3️⃣ Send audio for transcription
			const formData = new FormData()
			formData.append('audioFile', {
				uri,
				name: `recording-${Date.now()}.m4a`,
				type: 'audio/m4a',
			} as any)

			const transcriptionResponse = await transcribeMessageService(formData)

			if (!transcriptionResponse?.success) {
				throw new Error('Transcription failed')
			}

			const transcription = transcriptionResponse.data.text

			// 4️⃣ Replace temporary message with actual transcription
			setMessages(prev =>
				prev.map(msg => (msg.id === userMessageId ? { ...msg, text: transcription, thinking: false } : msg))
			)

			// 5️⃣ Add coach thinking placeholder
			const coachThinkingId = Crypto.randomUUID()

			setMessages(prev => [
				...prev,
				{
					id: coachThinkingId,
					role: 'coach',
					text: '',
					thinking: true,
				},
			])

			// 6️⃣ Ask backend for answer (memory + AI + TTS)
			const answerResponse = await sendMessageService(conversationId!, transcription)

			if (!answerResponse?.success) {
				throw new Error('Answer generation failed')
			}

			const { text, ttsId } = answerResponse.data

			// 7️⃣ Replace thinking message with coach replyd
			setMessages(prev => prev.map(msg => (msg.id === coachThinkingId ? { ...msg, text, thinking: false } : msg)))

			// 8️⃣ Play TTS audio
			const audioUri = COACH_SPEECH_ENDPOINT(ttsId)
			await startPlaying(audioUri)

			setIsThinking(false)
			setCoachState(CoachState.idle)
		} catch (error) {
			console.log('askQuestion error:', error)

			setMessages(prev =>
				prev.map(msg =>
					msg.thinking
						? {
								...msg,
								text: 'I couldn’t process that right now. Try again.',
								thinking: false,
							}
						: msg
				)
			)

			setIsThinking(false)
			setCoachState(CoachState.idle)
		}
	}

	const clearMessages = () => {
		setMessages([])
	}
	useEffect(() => {
		;(async () => {
			const status = await AudioModule.requestRecordingPermissionsAsync()
			if (!status.granted) {
				Alert.alert('Permission to access microphone was denied')
			}

			setAudioModeAsync({
				playsInSilentMode: true,
				allowsRecording: false,
			})
		})()
	}, [])

	// useEffect(() => {
	//   console.log(recorderState.metering);
	// }, [recorderState.metering]);

	// useEffect(() => {
	//   console.log("isPlaying", isPlaying);
	// }, [isPlaying, audioPlayer.playing]);

	// useEffect(() => {
	//   console.log("messages", messages);
	// }, [messages]);

	return {
		conversationId,
		messages,
		coachState,
		recorderState,
		isPlaying,
		isThinking,
		recordedAudioUri,

		startRecording,
		stopRecording,
		startPlaying,
		stopPlaying,
		clearRecording,

		initializeConversation,
		startConversation,
		sendVoiceMessage,
		clearMessages,
	}
}
