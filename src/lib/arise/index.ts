import { globalAriseRef } from './arise-ref'

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

  static info(options: AriseOptions | string) {
    const params = typeof options === 'string' ? { heading: options } : options
    globalAriseRef.current?.show({ ...params, type: 'info' })
  }

  static warn(options: AriseOptions | string) {
    const params = typeof options === 'string' ? { heading: options } : options
    globalAriseRef.current?.show({ ...params, type: 'warn' })
  }

  static custom(options: AriseOptions) {
    globalAriseRef.current?.show({ ...options, type: 'custom' })
  }

  static hide() {
    globalAriseRef.current?.hide()
  }
}

export { AriseRoot } from './arise-root'
export * from './types'
