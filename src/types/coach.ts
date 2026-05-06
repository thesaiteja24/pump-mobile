export enum CoachState {
  idle = 'idle',
  recording = 'recording',
  stopped = 'stopped',
}

export interface CoachMessage {
  id: string
  role: 'coach' | 'user'
  text: string
  thinking: boolean
}

export type ConversationResponse = {
  id: string
  messages: {
    id: string
    role: 'assistant' | 'user'
    content: string
    createdAt?: string
  }[]
}
