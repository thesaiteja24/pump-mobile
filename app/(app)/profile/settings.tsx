import { Button } from '@/components/ui/Button'
import { useAuth } from '@/stores/authStore'
import { useUser } from '@/stores/userStore'
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type WeightUnit = 'kg' | 'lbs'
type LengthUnit = 'cm' | 'inches'

export default function SettingsScreen() {
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	// Ref for the Bottom Sheet
	const unitSheetRef = useRef<BottomSheetModal>(null)

	const { user, logout } = useAuth()
	const { updatePreferences } = useUser()

	const storedWeightUnit: WeightUnit = user?.preferredWeightUnit ?? 'kg'
	const storedLengthUnit: LengthUnit = user?.preferredLengthUnit ?? 'cm'

	/* ---------------------------------------------
     Local modal state (draft)
  --------------------------------------------- */
	const [weightUnit, setWeightUnit] = useState<WeightUnit>(storedWeightUnit)
	const [lengthUnit, setLengthUnit] = useState<LengthUnit>(storedLengthUnit)

	/* ---------------------------------------------
     Reset draft when needed (triggered by present usually, 
     but we can sync on render or specific useEffect)
     
     Actually, let's sync state when opening?
     BottomSheetModal doesn't unmount, so we should reset state when dismissed or presented.
  --------------------------------------------- */

	// We can just rely on the fact that when we open, we want current user prefs.
	// But since we persist changes on close, local state should stay in sync or be reset to user state.

	// Let's reset to stored values whenever stored values change
	useEffect(() => {
		setWeightUnit(storedWeightUnit)
		setLengthUnit(storedLengthUnit)
	}, [storedWeightUnit, storedLengthUnit])

	/* ---------------------------------------------
     Detect changes
  --------------------------------------------- */
	const hasChanges = useMemo(() => {
		return weightUnit !== storedWeightUnit || lengthUnit !== storedLengthUnit
	}, [weightUnit, lengthUnit, storedWeightUnit, storedLengthUnit])

	/* ---------------------------------------------
     Close handler (onDismiss)
  --------------------------------------------- */
	const onDismiss = async () => {
		if (!hasChanges || !user?.userId) return

		await updatePreferences(user.userId, {
			preferredWeightUnit: weightUnit,
			preferredLengthUnit: lengthUnit,
		})
	}

	/* ---------------------------------------------
     Small helper
  --------------------------------------------- */
	const optionClass = (active: boolean, rounded?: string) =>
		[
			'w-1/2 py-2 border',
			rounded,
			active
				? 'bg-blue-500 border-blue-500 text-white'
				: 'bg-white border-neutral-200/60 text-black dark:bg-neutral-900 dark:border-neutral-800 dark:text-white',
		].join(' ')

	return (
		<View className="flex h-full items-center gap-4 bg-white p-4 dark:bg-black">
			{/* Logout */}

			<Button
				title="Logout"
				variant="danger"
				fullWidth
				leftIcon={<AntDesign name="logout" size={24} color="red" />}
				onPress={logout}
			/>

			{/* Unit preferences */}
			<Button
				title="Unit Preferences"
				leftIcon={
					<MaterialCommunityIcons name="pencil-ruler" size={24} color={isDarkMode ? 'white' : 'black'} />
				}
				fullWidth
				onPress={() => unitSheetRef.current?.present()}
			/>

			{/* Modal */}
			<BottomSheetModal
				ref={unitSheetRef}
				index={0}
				enableDynamicSizing={true}
				backdropComponent={props => (
					<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
				)}
				backgroundStyle={{
					backgroundColor: isDarkMode ? '#171717' : 'white',
				}}
				handleIndicatorStyle={{
					backgroundColor: isDarkMode ? '#525252' : '#d1d5db',
				}}
				onDismiss={onDismiss}
				// Smoother, slightly slower animation
				animationConfigs={{
					duration: 350,
				}}
			>
				<BottomSheetView
					style={{
						paddingBottom: insets.bottom + 16,
						paddingHorizontal: 24,
						paddingTop: 8,
					}}
				>
					<Text className="mb-6 text-center text-xl font-bold text-black dark:text-white">
						Unit Preferences
					</Text>

					<View className="flex flex-col gap-6">
						{/* Weight */}
						<View className="flex flex-row items-center justify-between">
							<Text className="w-1/2 text-lg font-semibold text-black dark:text-white">Weight</Text>

							<View className="flex w-1/2 flex-row">
								<TouchableOpacity
									onPress={() => setWeightUnit('kg')}
									className={optionClass(weightUnit === 'kg', 'rounded-l-full')}
								>
									<Text
										className={
											weightUnit === 'kg'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Kg
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() => setWeightUnit('lbs')}
									className={optionClass(weightUnit === 'lbs', 'rounded-r-full')}
								>
									<Text
										className={
											weightUnit === 'lbs'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Lbs
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Length */}
						<View className="flex flex-row items-center justify-between">
							<Text className="w-1/2 text-lg font-semibold text-black dark:text-white">Measurements</Text>

							<View className="flex w-1/2 flex-row">
								<TouchableOpacity
									onPress={() => setLengthUnit('cm')}
									className={optionClass(lengthUnit === 'cm', 'rounded-l-full')}
								>
									<Text
										className={
											lengthUnit === 'cm'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Cm
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() => setLengthUnit('inches')}
									className={optionClass(lengthUnit === 'inches', 'rounded-r-full')}
								>
									<Text
										className={
											lengthUnit === 'inches'
												? 'text-center text-white'
												: 'text-center text-black dark:text-white'
										}
									>
										Inches
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>

					{hasChanges && (
						<Text className="mt-6 text-center text-sm text-blue-500">
							Changes will be saved when you close this sheet
						</Text>
					)}
				</BottomSheetView>
			</BottomSheetModal>
		</View>
	)
}
