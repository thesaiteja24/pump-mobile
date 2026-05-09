import { globalAriseRef } from './ariseRef'
import type { AriseOptions } from './types'

export class Arise {
  static success(options: AriseOptions | string) {
    const params = typeof options === 'string' ? { heading: options } : options
    globalAriseRef.current?.show({ ...params, type: 'success' })
  }

  static error(options: AriseOptions | string) {
    const params = typeof options === 'string' ? { heading: options } : options
    globalAriseRef.current?.show({ ...params, type: 'error' })
  }

  static custom(options: AriseOptions) {
    globalAriseRef.current?.show({ ...options, type: 'custom' })
  }

  static hide() {
    globalAriseRef.current?.hide()
  }
}

export * from './types'
export { AriseRoot } from './AriseRoot'
