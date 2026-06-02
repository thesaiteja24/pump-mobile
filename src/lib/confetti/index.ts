import { globalConfettiRef } from './confetti-ref'

export class Confetti {
  static trigger() {
    globalConfettiRef.current?.trigger()
  }

  static stop() {
    globalConfettiRef.current?.stop()
  }
}

export { ConfettiRoot } from './confetti-root'
