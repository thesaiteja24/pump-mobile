import { Button } from '@/components/ui/Button'
import { GlassBackground } from '@/components/ui/GlassBackground'
import { useAddMeasurementMutation, useProfileQuery } from '@/hooks/queries/useMe'
import { useThemeColor } from '@/hooks/useThemeColor'
import { SelfUser } from '@/types/user'
import { calculateBodyFat, calculateComposition } from '@/utils/analytics'
import { convertLength, convertWeight } from '@/utils/converter'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetScrollView,
	BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import * as ImagePicker from 'expo-image-picker'
import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import {
	BackHandler,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export const MeasurementsSheet = forwardRef<BottomSheetModal>((props, ref) => {
	const colors = useThemeColor()
	const isDarkMode = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()
	const [isOpen, setIsOpen] = useState(false)
	const { data: userData } = useProfileQuery()
	const user = userData as SelfUser | null

	const gender = user?.gender
	// height from store is always in cm (backend canonical)
	const heightCm = user?.height
	const addMeasurementMutation = useAddMeasurementMutation()
	const isLoading = addMeasurementMutation.isPending

	// Preferred units — read from store
	const weightUnit = user?.preferredWeightUnit ?? 'kg'
	const lengthUnit = user?.preferredLengthUnit ?? 'cm'

	const lineHeight = Platform.OS === 'ios' ? 0 : 30

	// All measurement inputs are in the user's preferred display unit
	const [weight, setWeight] = useState('')
	const [neck, setNeck] = useState('')
	const [shoulders, setShoulders] = useState('')
	const [chest, setChest] = useState('')
	const [waist, setWaist] = useState('')
	const [abdomen, setAbdomen] = useState('')
	const [hips, setHips] = useState('')
	const [leftBicep, setLeftBicep] = useState('')
	const [rightBicep, setRightBicep] = useState('')
	const [leftForearm, setLeftForearm] = useState('')
	const [rightForearm, setRightForearm] = useState('')
	const [leftThigh, setLeftThigh] = useState('')
	const [rightThigh, setRightThigh] = useState('')
	const [leftCalf, setLeftCalf] = useState('')
	const [rightCalf, setRightCalf] = useState('')
	const [notes, setNotes] = useState('')
	const [progressPics, setProgressPics] = useState<{ uri: string; name: string; type: string }[]>([])

	const debouncedCalc = React.useMemo(() => {
		return {
			weight,
			neck,
			waist,
			hips,
		}
	}, [weight, neck, waist, hips])

	// Height is always from store in cm, no conversion needed for the body-fat formula (which requires cm)
	const parsedHeightCm = Number(heightCm)

	// --- Core profile checks ---
	const missingCoreProfile = !gender || !Number.isFinite(parsedHeightCm) || parsedHeightCm <= 0

	// Convert user's input values to cm for the body-fat formula (USN formula requires cm)
	const neckCm =
		lengthUnit === 'inches'
			? convertLength(Number(debouncedCalc.neck), { from: 'inches', to: 'cm' })
			: Number(debouncedCalc.neck)
	const waistCm =
		lengthUnit === 'inches'
			? convertLength(Number(debouncedCalc.waist), { from: 'inches', to: 'cm' })
			: Number(debouncedCalc.waist)
	const hipsCm =
		lengthUnit === 'inches'
			? convertLength(Number(debouncedCalc.hips), { from: 'inches', to: 'cm' })
			: Number(debouncedCalc.hips)

	const missingMeasurements =
		!Number.isFinite(neckCm) ||
		neckCm <= 0 ||
		!Number.isFinite(waistCm) ||
		waistCm <= 0 ||
		(gender === 'female' && (!Number.isFinite(hipsCm) || hipsCm <= 0))

	const isCompositionLocked = missingCoreProfile || missingMeasurements

	// Body fat calculated with cm values (as the formula requires)
	const bodyFat = !isCompositionLocked
		? calculateBodyFat({
				gender: gender!,
				height: parsedHeightCm, // always cm from store
				neck: neckCm, // converted to cm
				waist: waistCm, // converted to cm
				hips: gender === 'female' ? hipsCm : undefined,
			})
		: null

	// Weight in kg for composition (convert from user unit if needed)
	const weightKg =
		weightUnit === 'lbs'
			? convertWeight(Number(debouncedCalc.weight), { from: 'lbs', to: 'kg' })
			: Number(debouncedCalc.weight)

	const composition = bodyFat != null && weightKg > 0 ? calculateComposition({ weight: weightKg, bodyFat }) : null

	const bodyFatDisplay = bodyFat != null ? bodyFat.toFixed(1) : ''
	const leanMassDisplay = composition?.leanMass != null ? composition.leanMass.toFixed(2) : ''

	// leanBodyMass in kg — for backend storage
	const leanBodyMassKg = composition?.leanMass?.toFixed(2) ?? ''

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (isOpen) {
				// @ts-ignore
				ref?.current?.dismiss()
				return true
			}
			return false
		})
		return () => backHandler.remove()
	}, [isOpen, ref])

	const pickImages = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: 'images',
			allowsMultipleSelection: true,
			quality: 0.8,
		})

		if (!result.canceled) {
			try {
				const processedPics = await Promise.all(
					result.assets.map(async asset => {
						const prepared = await prepareImageForUpload(
							{
								uri: asset.uri,
								fileName: asset.fileName || `progress_${Date.now()}.jpg`,
								type: asset.mimeType || 'image/jpeg',
							},
							'post'
						)
						return prepared as { uri: string; name: string; type: string }
					})
				)
				setProgressPics(prev => [...prev, ...processedPics])
			} catch (error) {
				Toast.show({ type: 'error', text1: 'Failed to process some images' })
				console.error('Error processing images:', error)
			}
		}
	}

	const handleRemovePic = (index: number) => {
		setProgressPics(prev => prev.filter((_, i) => i !== index))
	}

	const handleSave = useCallback(async () => {
		if (!user?.id) return

		// Validate that at least weight or one measurement is provided
		const hasAnyInput = [
			weight,
			neck,
			waist,
			hips,
			shoulders,
			chest,
			abdomen,
			leftBicep,
			rightBicep,
			leftForearm,
			rightForearm,
			leftThigh,
			rightThigh,
			leftCalf,
			rightCalf,
		].some(v => v.trim().length > 0)

		if (!hasAnyInput && !notes && progressPics.length === 0) {
			Toast.show({ type: 'error', text1: 'Please enter at least one measurement before saving.' })
			return
		}

		Keyboard.dismiss()

		const payload: Record<string, any> = {
			date: new Date().toISOString(),
		}

		/**
		 * Append a measurement to formData after converting to the canonical backend unit.
		 * Length values (cm) — convert from user's lengthUnit → cm.
		 * Weight values (kg) — convert from user's weightUnit → kg.
		 */
		const appendLength = (key: string, val: string) => {
			const parsed = parseFloat(val)
			if (!val || isNaN(parsed) || parsed <= 0) return
			const inCm = convertLength(parsed, { from: lengthUnit, to: 'cm' })
			payload[key] = Number(inCm.toFixed(2))
		}

		const appendKg = (key: string, val: string) => {
			const parsed = parseFloat(val)
			if (!val || isNaN(parsed) || parsed <= 0) return
			const inKg = convertWeight(parsed, { from: weightUnit, to: 'kg' })
			payload[key] = Number(inKg.toFixed(2))
		}

		const appendRaw = (key: string, val: string | number) => {
			const parsed = typeof val === 'string' ? parseFloat(val) : val
			if (!val || isNaN(parsed)) return
			payload[key] = typeof val === 'string' ? Number(parsed.toFixed(2)) : parsed
		}

		// Weight → kg
		appendKg('weight', weight)

		// Body composition — these are derived numbers already in the canonical unit
		appendRaw('bodyFat', bodyFatDisplay)
		appendRaw('leanBodyMass', leanBodyMassKg)

		// Length measurements → cm
		appendLength('neck', neck)
		appendLength('shoulders', shoulders)
		appendLength('chest', chest)
		appendLength('waist', waist)
		appendLength('abdomen', abdomen)
		appendLength('hips', hips)
		appendLength('leftBicep', leftBicep)
		appendLength('rightBicep', rightBicep)
		appendLength('leftForearm', leftForearm)
		appendLength('rightForearm', rightForearm)
		appendLength('leftThigh', leftThigh)
		appendLength('rightThigh', rightThigh)
		appendLength('leftCalf', leftCalf)
		appendLength('rightCalf', rightCalf)

		if (notes) payload.notes = notes
		if (progressPics.length > 0) payload.progressPics = progressPics

		const res = await addMeasurementMutation.mutateAsync(payload as any)

		if (res) {
			Toast.show({ type: 'success', text1: 'Measurements saved successfully!' })
			// @ts-ignore
			ref?.current?.dismiss()

			// Reset fields after successful save
			setWeight('')
			setNeck('')
			setShoulders('')
			setChest('')
			setWaist('')
			setAbdomen('')
			setHips('')
			setLeftBicep('')
			setRightBicep('')
			setLeftForearm('')
			setRightForearm('')
			setLeftThigh('')
			setRightThigh('')
			setLeftCalf('')
			setRightCalf('')
			setNotes('')
			setProgressPics([])
		} else {
			Toast.show({ type: 'error', text1: 'Failed to save check-in' })
		}
	}, [
		weight,
		bodyFatDisplay,
		leanBodyMassKg,
		neck,
		shoulders,
		chest,
		waist,
		abdomen,
		hips,
		leftBicep,
		rightBicep,
		leftForearm,
		rightForearm,
		leftThigh,
		rightThigh,
		leftCalf,
		rightCalf,
		notes,
		progressPics,
		user?.id,
		addMeasurementMutation,
		ref,
		weightUnit,
		lengthUnit,
	])

	return (
		<BottomSheetModal
			ref={ref}
			index={0}
			snapPoints={['90%']}
			enableDynamicSizing={false}
			backdropComponent={props => (
				<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
			)}
			backgroundComponent={GlassBackground}
			handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#525252' : '#d1d5db' }}
			animationConfigs={{ duration: 350 }}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
			style={{ marginTop: insets.top }}
			stackBehavior="push"
			onChange={index => setIsOpen(index >= 0)}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={100}
			>
				<BottomSheetScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{
						paddingHorizontal: 24,
						paddingTop: 8,
						paddingBottom: insets.bottom + 100,
					}}
					nestedScrollEnabled
					showsVerticalScrollIndicator={false}
				>
					<Text className="mb-2 text-center text-xl font-bold text-black dark:text-white">
						Add Measurements
					</Text>
					<Text className="mb-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
						Log body measurements and progress photos.
					</Text>

					<View className="flex flex-col gap-2">
						{/* --- Pictures --- */}
						<SectionHeader title="Progress Pictures" />
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							nestedScrollEnabled
							className="mb-4 py-4"
						>
							<TouchableOpacity
								onPress={pickImages}
								className="mr-3 h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
							>
								<MaterialCommunityIcons
									name="camera-plus"
									size={28}
									color={isDarkMode ? '#A3A3A3' : '#737373'}
								/>
								<Text className="mt-1 text-xs text-neutral-500">Add Photo</Text>
							</TouchableOpacity>

							{progressPics.map((pic, index) => (
								<View key={index} className="relative mr-3 h-24 w-24 rounded-xl">
									<Image source={{ uri: pic.uri }} className="h-full w-full rounded-xl" />
									<TouchableOpacity
										onPress={() => handleRemovePic(index)}
										className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1"
									>
										<MaterialCommunityIcons name="close" size={14} color="white" />
									</TouchableOpacity>
								</View>
							))}
						</ScrollView>

						{/* --- Notes --- */}
						<SectionHeader title="Notes" />
						<BottomSheetTextInput
							value={notes}
							onChangeText={setNotes}
							placeholder="Any reflections on today's progress?"
							placeholderTextColor={colors.neutral[500]}
							multiline
							numberOfLines={3}
							className="min-h-[80px] rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-base text-black dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
							style={{ textAlignVertical: 'top' }}
						/>

						{/* --- General --- */}
						<SectionHeader title="General" />
						<MeasurementInput
							label={`Weight (${weightUnit})`}
							value={weight}
							onChangeText={setWeight}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>

						{/* Neck, Waist, Hips — used for body fat calculation, must be in user's length unit */}
						<MeasurementInput
							label={`Neck (${lengthUnit})`}
							value={neck}
							onChangeText={setNeck}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label={`Waist (${lengthUnit})`}
							value={waist}
							onChangeText={setWaist}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label={`Hips (${lengthUnit})`}
							value={hips}
							onChangeText={setHips}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>

						{/* Auto-calculated body composition */}
						<View className="relative">
							<View style={{ opacity: isCompositionLocked ? 0.3 : 1 }}>
								<MeasurementInput
									label="Body Fat %"
									badge="Auto-calculated"
									value={bodyFatDisplay}
									editable={false}
									colors={colors}
									lineHeight={lineHeight}
								/>
								<MeasurementInput
									label={`Lean Body Mass (${weightUnit})`}
									badge="Auto-calculated"
									value={leanMassDisplay}
									editable={false}
									colors={colors}
									lineHeight={lineHeight}
								/>
							</View>

							{isCompositionLocked && (
								<View className="absolute inset-0 items-center justify-center rounded-xl bg-white/80 dark:bg-neutral-900/80">
									<View className="items-center px-6">
										<MaterialCommunityIcons name="lock-outline" size={24} color={colors.text} />
										<Text className="mt-2 text-center text-sm font-medium text-black dark:text-white">
											Height, Gender, Neck & Waist measurements are required to perform
											calculations
										</Text>
									</View>
								</View>
							)}
						</View>

						{/* --- Torso --- */}
						<SectionHeader title={`Torso (${lengthUnit})`} />
						<MeasurementInput
							label="Shoulders"
							value={shoulders}
							onChangeText={setShoulders}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Chest"
							value={chest}
							onChangeText={setChest}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Abdomen"
							value={abdomen}
							onChangeText={setAbdomen}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>

						{/* --- Arms --- */}
						<SectionHeader title={`Arms (${lengthUnit})`} />
						<MeasurementInput
							label="Left Bicep"
							value={leftBicep}
							onChangeText={setLeftBicep}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Right Bicep"
							value={rightBicep}
							onChangeText={setRightBicep}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Left Forearm"
							value={leftForearm}
							onChangeText={setLeftForearm}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Right Forearm"
							value={rightForearm}
							onChangeText={setRightForearm}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>

						{/* --- Legs --- */}
						<SectionHeader title={`Legs (${lengthUnit})`} />
						<MeasurementInput
							label="Left Thigh"
							value={leftThigh}
							onChangeText={setLeftThigh}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Right Thigh"
							value={rightThigh}
							onChangeText={setRightThigh}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Left Calf"
							value={leftCalf}
							onChangeText={setLeftCalf}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
						<MeasurementInput
							label="Right Calf"
							value={rightCalf}
							onChangeText={setRightCalf}
							editable={!isLoading}
							colors={colors}
							lineHeight={lineHeight}
						/>
					</View>

					<Button
						title="Save Measurements"
						variant="primary"
						loading={isLoading}
						className="mt-8"
						onPress={handleSave}
						liquidGlass
					/>
				</BottomSheetScrollView>
			</KeyboardAvoidingView>
		</BottomSheetModal>
	)
})

interface MeasurementInputProps {
	label: string
	badge?: string
	value: string
	onChangeText?: (text: string) => void
	editable?: boolean
	colors: ReturnType<typeof useThemeColor>
	lineHeight: number
}

const MeasurementInput = React.memo(
	function MeasurementInput({
		label,
		badge,
		value,
		onChangeText,
		editable,
		colors,
		lineHeight,
	}: MeasurementInputProps) {
		return (
			<View className="flex flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-800">
				<View className="flex flex-row items-center gap-2">
					<Text className="text-base font-medium text-black dark:text-white">{label}</Text>
					{badge && (
						<View className="flex-row items-center gap-2 rounded-full border border-blue-500 bg-blue-500/15 px-2 py-1">
							<Text className="text-xs text-blue-600">{badge}</Text>
						</View>
					)}
				</View>
				<BottomSheetTextInput
					value={value}
					placeholder="--"
					placeholderTextColor={colors.neutral[500]}
					keyboardType="decimal-pad"
					onChangeText={onChangeText}
					editable={editable}
					className="min-w-[60px] text-right text-lg text-primary"
					style={{ color: colors.primary, lineHeight }}
				/>
			</View>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.value === nextProps.value &&
			prevProps.editable === nextProps.editable &&
			prevProps.label === nextProps.label &&
			prevProps.badge === nextProps.badge &&
			prevProps.colors === nextProps.colors &&
			prevProps.lineHeight === nextProps.lineHeight
		)
	}
)

const SectionHeader = React.memo(({ title }: { title: string }) => (
	<Text className="mb-2 mt-4 text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
		{title}
	</Text>
))

SectionHeader.displayName = 'SectionHeader'

MeasurementsSheet.displayName = 'MeasurementsSheet'
