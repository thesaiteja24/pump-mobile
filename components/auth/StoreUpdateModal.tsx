import { useThemeColor } from '@/hooks/useThemeColor'
import { Modal, Text, View, useColorScheme } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Button } from '../ui/Button'
import { GlassView } from '../ui/GlassView'

type Props = {
	visible: boolean
	onLater: () => void
	onUpdate: () => void
	latestVersion?: string
}

export function StoreUpdateModal({ visible, onLater, onUpdate, latestVersion }: Props) {
	const colors = useThemeColor()
	const isDark = useColorScheme() === 'dark'

	return (
		<Modal transparent visible={visible} animationType="fade">
			<View className="flex-1 items-center justify-center bg-black/40 px-6">
				<Animated.View
					entering={FadeIn.duration(400)}
					className="w-full"
				>
					<GlassView
						className="w-full p-6"
						style={{
							elevation: 20,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 10 },
							shadowOpacity: 0.3,
							shadowRadius: 20,
						}}
					>
						<Animated.View entering={FadeInDown.delay(200).springify()}>
							<View className="items-center">
								<Text
									className="text-center text-2xl font-bold tracking-tight"
									style={{ color: colors.text }}
								>
									Update Available
								</Text>

								<View className="mt-2 rounded-full bg-primary/10 px-3 py-1">
									<Text className="text-xs font-semibold" style={{ color: colors.primary }}>
										NEW VERSION {latestVersion ? `v${latestVersion}` : ''}
									</Text>
								</View>

								<Text
									className="mt-4 text-center text-lg leading-6"
									style={{ color: colors.neutral[500] }}
								>
									A new version of Pump is available in the Play Store. Update now to get the latest
									features and performance improvements.
								</Text>
							</View>

							<View className="mt-8 flex-row gap-4">
								<Button
									onPress={onLater}
									title="Later"
									variant="outline"
									className="flex-1"
									liquidGlass
								/>
								<Button
									onPress={onUpdate}
									title="Update Now"
									variant="primary"
									className="flex-1"
									liquidGlass
								/>
							</View>
						</Animated.View>
					</GlassView>
				</Animated.View>
			</View>
		</Modal>
	)
}
