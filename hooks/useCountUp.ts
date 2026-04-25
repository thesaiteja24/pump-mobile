import { useEffect, useState } from 'react'
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

/** Animates a number from 0 → target on mount, returns formatted string */
export function useCountUp(target: number | null | undefined, decimals = 1, delay = 400): string {
  const defaultPlaceholder = '--'
  const [display, setDisplay] = useState(defaultPlaceholder)
  const sv = useSharedValue(0)

  useEffect(() => {
    if (target == null || isNaN(target)) {
      setDisplay(defaultPlaceholder)
      return
    }

    // Reset logic when target changes
    sv.value = 0
    setDisplay(decimals > 0 ? '0.' + '0'.repeat(decimals) : '0')

    sv.value = withDelay(
      delay,
      withTiming(target, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delay, decimals])

  useAnimatedReaction(
    () => sv.value,
    (val) => {
      if (target != null && !isNaN(target)) {
        runOnJS(setDisplay)(val.toFixed(decimals))
      }
    },
  )

  return display
}
