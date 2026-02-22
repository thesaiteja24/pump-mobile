import { useThemeColor } from '@/hooks/useThemeColor'
import { formatSeconds } from '@/utils/time'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'

/* --------------------------------------------------
   Types
-------------------------------------------------- */

/**
 * Props for wall-clock mode.
 *
 * Displays the time elapsed since a fixed start Date.
 */
export interface ElapsedTimeWallClockProps {
	/**
	 * Start time of the timer.
	 * The component will show the elapsed time since this Date.
	 */
	startTime: Date

	/**
	 * Optional text styling for the displayed timer.
	 */
	textClassName?: string
}

/**
 * Props for accumulated mode.
 *
 * Displays a base duration plus optional running time.
 */
export interface ElapsedTimeAccumulatedProps {
	/**
	 * Base duration in seconds already accumulated.
	 *
	 * @default 0
	 */
	baseSeconds?: number

	/**
	 * Timestamp (in milliseconds) when the timer started running.
	 * If omitted or null, the timer will not increment.
	 */
	runningSince?: number | null

	/**
	 * Optional text styling for the displayed timer.
	 */
	textClassName?: string
}

/**
 * Props for the ElapsedTime component.
 *
 * Exactly one mode must be used:
 * - Wall clock mode → provide `startTime`
 * - Accumulated mode → provide `baseSeconds` and/or `runningSince`
 */
export type ElapsedTimeProps = ElapsedTimeWallClockProps | ElapsedTimeAccumulatedProps

/* --------------------------------------------------
   Component
-------------------------------------------------- */

/**
 * ElapsedTime
 *
 * A live-updating timer component that displays elapsed time
 * in `hh:mm:ss` format.
 *
 * Modes:
 * - **Wall Clock Mode**: Shows time elapsed since a fixed start date.
 * - **Accumulated Mode**: Shows accumulated seconds plus optional running time.
 *
 * The component updates once per second while running.
 *
 * @example
 * // Wall clock mode
 * <ElapsedTime startTime={new Date()} />
 *
 * @example
 * // Accumulated mode
 * <ElapsedTime baseSeconds={120} runningSince={Date.now()} />
 */
export function ElapsedTime(props: ElapsedTimeProps) {
	const [now, setNow] = useState(Date.now())
	const colors = useThemeColor()

	const isWallClock = 'startTime' in props
	const runningSince = !isWallClock ? props.runningSince : null

	useEffect(() => {
		if (!isWallClock && !runningSince) return

		const id = setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => clearInterval(id)
	}, [isWallClock, runningSince])

	let totalSeconds = 0

	if (isWallClock) {
		totalSeconds = Math.max(0, Math.floor((now - props.startTime.getTime()) / 1000))
	} else {
		const base = props.baseSeconds ?? 0
		const running = runningSince != null ? Math.max(0, Math.floor((now - runningSince) / 1000)) : 0

		totalSeconds = base + running
	}

	return (
		<Text
			className={props.textClassName ?? 'text-lg font-semibold'}
			style={!props.textClassName ? { color: colors.text } : undefined}
		>
			{formatSeconds(totalSeconds)}
		</Text>
	)
}
