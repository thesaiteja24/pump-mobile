export type AriseType = 'success' | 'error' | 'custom'

export interface AriseOptions {
  heading: string
  content?: string
  sound?: boolean | string
  haptic?: 'light' | 'medium' | 'heavy' | 'none'
  confetti?: boolean
  // Custom-only overrides
  icon?: string // e.g., 'checkmark-circle'
  iconColor?: string // e.g., '#10b981'
}

export interface AriseCallParams extends AriseOptions {
  type: AriseType
}

export interface AriseRefMethods {
  show: (params: AriseCallParams) => void
  hide: () => void
}
