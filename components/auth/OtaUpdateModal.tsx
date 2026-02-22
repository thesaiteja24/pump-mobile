import { useThemeColor } from '@/hooks/useThemeColor'
import { useRef } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

type UpdateState = 'idle' | 'downloading' | 'restarting'

type Props = {
	visible: boolean
	state: UpdateState
	onLater: () => void
	onRestart: () => Promise<void>
}

export function OtaUpdateModal({ visible, state, onLater, onRestart }: Props) {
	const isBusy = state !== 'idle'
	const colors = useThemeColor()

	// 🔒 Immediate synchronous lock (no re-render needed)
	const restartLockedRef = useRef(false)

	return (
		<Modal transparent visible={visible} animationType="fade">
			<View className="flex-1 items-center justify-center bg-black/60 px-6">
				<View
					className="w-full rounded-2xl border p-6 shadow-xl"
					style={{
						backgroundColor: colors.background,
						borderColor: colors.neutral[200],
						shadowColor: '#000',
						elevation: 8,
					}}
					pointerEvents={isBusy ? 'none' : 'auto'}
				>
					<Text className="text-center text-xl font-bold" style={{ color: colors.text }}>
						Update available
					</Text>

					<Text className="mt-3 text-center" style={{ color: colors.neutral[500] }}>
						{state === 'idle' && 'A new version of Pump is ready. Restart to apply it.'}
						{state === 'downloading' && 'Downloading update…'}
						{state === 'restarting' && 'Restarting app…'}
					</Text>

					{/* Progress bar */}
					{state !== 'idle' && (
						<View
							className="mt-5 h-2 w-full overflow-hidden rounded-full"
							style={{ backgroundColor: colors.neutral[200] }}
						>
							<View
								className={`h-full ${state === 'downloading' ? 'w-2/3' : 'w-full'}`}
								style={{ backgroundColor: colors.text }}
							/>
						</View>
					)}

					<View className="mt-6 flex-row gap-3">
						{/* Later */}
						<Pressable
							disabled={isBusy}
							onPress={onLater}
							className={`flex-1 rounded-xl border py-3 ${isBusy ? 'opacity-40' : ''}`}
							style={{
								borderColor: colors.neutral[200],
							}}
						>
							<Text className="text-center" style={{ color: colors.text }}>
								Later
							</Text>
						</Pressable>

						{/* Restart */}
						<Pressable
							disabled={isBusy}
							onPress={async () => {
								// 🔐 Guard against multi-tap
								if (restartLockedRef.current) return
								restartLockedRef.current = true

								try {
									await onRestart()
								} catch {
									// Unlock only if something goes wrong
									restartLockedRef.current = false
								}
							}}
							className={`flex-1 rounded-xl py-3 ${isBusy ? 'bg-gray-400' : ''}`}
							style={
								!isBusy
									? {
											backgroundColor: colors.text, // Invert bg for primary button effect if using text color, or use colors.primary
										}
									: undefined
							}
						>
							<Text
								className="text-center font-semibold"
								style={{
									color: !isBusy ? colors.background : 'white', // Text color should be background color (inverted)
								}}
							>
								Restart
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	)
}
