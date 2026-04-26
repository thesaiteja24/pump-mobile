export const CoachState = {
  idle: 'idle',
  recording: 'recording',
  stopped: 'stopped',
} as const

export interface CoachMessage {
  id: string
  role: 'coach' | 'user'
  text: string
  thinking: boolean
}

export type CoachState = (typeof CoachState)[keyof typeof CoachState]
