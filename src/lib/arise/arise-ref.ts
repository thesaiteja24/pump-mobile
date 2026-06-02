import type { AriseRefMethods } from './types'

export const globalAriseRef: { current: AriseRefMethods | null } = {
  current: null,
}
