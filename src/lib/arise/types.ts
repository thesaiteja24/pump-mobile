export type AriseType = 'success' | 'error' | 'info' | 'warn' | 'custom'

export interface AriseOptions {
  heading: string
  content?: string
  sound?: boolean | string
  haptic?: 'light' | 'medium' | 'heavy' | 'none'
  confetti?: boolean
  /** Ionicons name, e.g., 'checkmark-circle' */
  icon?: string
  /** Hex or PALETTE color, e.g., '#10b981' */
  iconColor?: string
}

export interface AriseCallParams extends AriseOptions {
  type: AriseType
}

export interface AriseRefMethods {
  show: (params: AriseCallParams) => void
  hide: () => void
}
