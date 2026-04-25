import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/queries/useMe'
import { SelfUser } from '@/types/user'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { BackHandler, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassBackground } from '@/components/ui/GlassBackground'

type WeightUnit = 'kg' | 'lbs'
type LengthUnit = 'cm' | 'inches'

export const UnitPreferencesSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null

  const updateUserDataMutation = useUpdateProfileMutation()
  const isDarkMode = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const [isOpen, setIsOpen] = useState(false)

  const storedWeightUnit: WeightUnit = user?.preferredWeightUnit ?? 'kg'
  const storedLengthUnit: LengthUnit = user?.preferredLengthUnit ?? 'cm'

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(storedWeightUnit)
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(storedLengthUnit)

  // Keep internal state in sync if store updates externally
  useEffect(() => {
    setWeightUnit(storedWeightUnit)
    setLengthUnit(storedLengthUnit)
  }, [storedWeightUnit, storedLengthUnit])

  const hasChanges = useMemo(() => {
    return weightUnit !== storedWeightUnit || lengthUnit !== storedLengthUnit
  }, [weightUnit, lengthUnit, storedWeightUnit, storedLengthUnit])

  const onDismiss = async () => {
    setIsOpen(false)
    if (!hasChanges || !user?.id) return

    updateUserDataMutation.mutate({
      preferredWeightUnit: weightUnit,
      preferredLengthUnit: lengthUnit,
    })
  }

  // Handle hardware back button on Android
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

  const optionClass = (active: boolean, rounded?: string) =>
    [
      'w-1/2 py-2 border',
      rounded,
      active
        ? 'bg-blue-500 border-blue-500 text-white'
        : 'bg-white border-neutral-200/60 text-black dark:bg-neutral-900 dark:border-neutral-800 dark:text-white',
    ].join(' ')

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      enableDynamicSizing={true}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      )}
      backgroundComponent={GlassBackground}
      handleIndicatorStyle={{
        backgroundColor: isDarkMode ? '#525252' : '#d1d5db',
      }}
      onDismiss={onDismiss}
      onChange={(index) => setIsOpen(index >= 0)}
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

          <View className="flex flex-row items-center justify-between">
            <Text className="w-1/2 text-lg font-semibold text-black dark:text-white">
              Measurements
            </Text>
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
  )
})

UnitPreferencesSheet.displayName = 'UnitPreferencesSheet'
