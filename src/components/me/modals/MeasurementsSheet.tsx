import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useAddMeasurementMutation, useProfileQuery } from '@/hooks/queries/me'
import { useThemeColor } from '@/hooks/theme'
import { useUnitConverter } from '@/hooks/useUnitConverter'
import { SelfUser } from '@/types/me'
import { calculateBodyFat, calculateComposition } from '@/utils/analytics'
import { prepareImageForUpload } from '@/utils/prepareImageForUpload'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as ImagePicker from 'expo-image-picker'
import React, { forwardRef, useCallback, useMemo, useState } from 'react'
import { Image, Keyboard, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'

type MeasurementKey =
  | 'weight'
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'waist'
  | 'abdomen'
  | 'hips'
  | 'leftBicep'
  | 'rightBicep'
  | 'leftForearm'
  | 'rightForearm'
  | 'leftThigh'
  | 'rightThigh'
  | 'leftCalf'
  | 'rightCalf'

const INITIAL_MEASUREMENTS: Record<MeasurementKey, string> = {
  weight: '',
  neck: '',
  shoulders: '',
  chest: '',
  waist: '',
  abdomen: '',
  hips: '',
  leftBicep: '',
  rightBicep: '',
  leftForearm: '',
  rightForearm: '',
  leftThigh: '',
  rightThigh: '',
  leftCalf: '',
  rightCalf: '',
}

type Section = {
  title: string
  fields: { key: MeasurementKey; label: string }[]
}

type Props = object

export const MeasurementsSheet = forwardRef<BaseModalHandle, Props>((_, ref) => {
  const colors = useThemeColor()
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null

  const { toCanonicalWeight, toCanonicalLength, weightUnit, lengthUnit } = useUnitConverter()

  const gender = user?.gender
  const heightCm = user?.height
  const addMeasurementMutation = useAddMeasurementMutation()
  const isLoading = addMeasurementMutation.isPending

  const lineHeight = Platform.OS === 'ios' ? 0 : 30

  // Single state for all measurements
  const [measurements, setMeasurements] = useState(INITIAL_MEASUREMENTS)
  const [notes, setNotes] = useState('')
  const [progressPics, setProgressPics] = useState<{ uri: string; name: string; type: string }[]>(
    [],
  )

  const handleInputChange = useCallback((key: MeasurementKey, value: string) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Section configuration
  const sections: Section[] = useMemo(
    () => [
      {
        title: 'General',
        fields: [
          { key: 'weight', label: `Weight (${weightUnit})` },
          { key: 'neck', label: `Neck (${lengthUnit})` },
          { key: 'waist', label: `Waist (${lengthUnit})` },
          { key: 'hips', label: `Hips (${lengthUnit})` },
        ],
      },
      {
        title: `Torso (${lengthUnit})`,
        fields: [
          { key: 'shoulders', label: 'Shoulders' },
          { key: 'chest', label: 'Chest' },
          { key: 'abdomen', label: 'Abdomen' },
        ],
      },
      {
        title: `Arms (${lengthUnit})`,
        fields: [
          { key: 'leftBicep', label: 'Left Bicep' },
          { key: 'rightBicep', label: 'Right Bicep' },
          { key: 'leftForearm', label: 'Left Forearm' },
          { key: 'rightForearm', label: 'Right Forearm' },
        ],
      },
      {
        title: `Legs (${lengthUnit})`,
        fields: [
          { key: 'leftThigh', label: 'Left Thigh' },
          { key: 'rightThigh', label: 'Right Thigh' },
          { key: 'leftCalf', label: 'Left Calf' },
          { key: 'rightCalf', label: 'Right Calf' },
        ],
      },
    ],
    [weightUnit, lengthUnit],
  )

  // Calculations
  const { bodyFatDisplay, leanMassDisplay, isCompositionLocked, leanBodyMassKg } = useMemo(() => {
    const parsedHeightCm = Number(heightCm)
    const missingCoreProfile = !gender || !Number.isFinite(parsedHeightCm) || parsedHeightCm <= 0

    const neckCm = toCanonicalLength(Number(measurements.neck))
    const waistCm = toCanonicalLength(Number(measurements.waist))
    const hipsCm = toCanonicalLength(Number(measurements.hips))

    const missingMeasurements =
      !Number.isFinite(neckCm) ||
      neckCm <= 0 ||
      !Number.isFinite(waistCm) ||
      waistCm <= 0 ||
      (gender === 'female' && (!Number.isFinite(hipsCm) || hipsCm <= 0))

    const locked = missingCoreProfile || missingMeasurements

    const bf = !locked
      ? calculateBodyFat({
          gender: gender!,
          height: parsedHeightCm,
          neck: neckCm,
          waist: waistCm,
          hips: gender === 'female' ? hipsCm : undefined,
        })
      : null

    const weightKg = toCanonicalWeight(Number(measurements.weight))
    const comp =
      bf != null && weightKg > 0 ? calculateComposition({ weight: weightKg, bodyFat: bf }) : null

    return {
      bodyFatDisplay: bf != null ? bf.toFixed(1) : '',
      leanMassDisplay: comp?.leanMass != null ? comp.leanMass.toFixed(2) : '',
      leanBodyMassKg: comp?.leanMass?.toFixed(2) ?? '',
      isCompositionLocked: locked,
    }
  }, [
    gender,
    heightCm,
    measurements.neck,
    measurements.waist,
    measurements.hips,
    measurements.weight,
    toCanonicalLength,
    toCanonicalWeight,
  ])

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      try {
        const processedPics = await Promise.all(
          result.assets.map(async (asset) => {
            const prepared = await prepareImageForUpload(
              {
                uri: asset.uri,
                fileName: asset.fileName || `progress_${Date.now()}.jpg`,
                type: asset.mimeType || 'image/jpeg',
              },
              'post',
            )
            return prepared as { uri: string; name: string; type: string }
          }),
        )
        setProgressPics((prev) => [...prev, ...processedPics])
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to process some images' })
        console.error('Error processing images:', error)
      }
    }
  }

  const handleRemovePic = (index: number) => {
    setProgressPics((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = useCallback(async () => {
    if (!user?.id) return

    const hasAnyInput = Object.values(measurements).some((v) => v.trim().length > 0)

    if (!hasAnyInput && !notes && progressPics.length === 0) {
      Toast.show({ type: 'error', text1: 'Please enter at least one measurement before saving.' })
      return
    }

    Keyboard.dismiss()

    const payload: Record<string, any> = {
      date: new Date().toISOString(),
    }

    // Process all measurements
    Object.entries(measurements).forEach(([key, val]) => {
      const parsed = parseFloat(val)
      if (!val || isNaN(parsed) || parsed <= 0) return

      if (key === 'weight') {
        const inKg = toCanonicalWeight(parsed)
        payload[key] = Number(inKg.toFixed(2))
      } else {
        const inCm = toCanonicalLength(parsed)
        payload[key] = Number(inCm.toFixed(2))
      }
    })

    // Derived values
    if (bodyFatDisplay) payload.bodyFat = Number(parseFloat(bodyFatDisplay).toFixed(2))
    if (leanBodyMassKg) payload.leanBodyMass = Number(parseFloat(leanBodyMassKg).toFixed(2))
    if (notes) payload.notes = notes
    if (progressPics.length > 0) payload.progressPics = progressPics

    try {
      const res = await addMeasurementMutation.mutateAsync(payload as any)
      if (res) {
        Toast.show({ type: 'success', text1: 'Measurements saved successfully!' })
        const modalRef = ref as React.RefObject<BaseModalHandle>
        modalRef.current?.dismiss()
        setMeasurements(INITIAL_MEASUREMENTS)
        setNotes('')
        setProgressPics([])
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save check-in' })
    }
  }, [
    user?.id,
    measurements,
    notes,
    progressPics,
    bodyFatDisplay,
    leanBodyMassKg,
    addMeasurementMutation,
    toCanonicalWeight,
    toCanonicalLength,
    ref,
  ])

  return (
    <BaseModal
      ref={ref}
      title="Add Measurements"
      description="Log body measurements and progress photos."
      confirmAction={{
        title: 'Save Measurements',
        onPress: handleSave,
        loading: isLoading,
      }}
    >
      <View className="flex flex-col gap-2">
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
            <MaterialCommunityIcons name="camera-plus" size={28} color={colors.neutral[500]} />
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

        {sections.map((section) => (
          <React.Fragment key={section.title}>
            <SectionHeader title={section.title} />
            {section.fields.map((field) => (
              <MeasurementInput
                key={field.key}
                label={field.label}
                value={measurements[field.key]}
                onChangeText={(text) => handleInputChange(field.key, text)}
                editable={!isLoading}
                colors={colors}
                lineHeight={lineHeight}
              />
            ))}

            {/* Special handling for auto-calculated fields in General section */}
            {section.title === 'General' && (
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
            )}
          </React.Fragment>
        ))}
      </View>
    </BaseModal>
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
  },
)

const SectionHeader = React.memo(({ title }: { title: string }) => (
  <Text className="mb-2 mt-4 text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
    {title}
  </Text>
))

SectionHeader.displayName = 'SectionHeader'
MeasurementsSheet.displayName = 'MeasurementsSheet'
export default MeasurementsSheet
