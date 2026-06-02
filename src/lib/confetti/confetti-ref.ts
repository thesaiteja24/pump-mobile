export interface ConfettiRefMethods {
  trigger: () => void
  stop: () => void
}

export const globalConfettiRef: { current: ConfettiRefMethods | null } = {
  current: null,
}
