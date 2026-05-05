import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/queries/me'
import { useThemeColor } from '@/hooks/theme'
import { SelfUser } from '@/types/me'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'

type WeightUnit = 'kg' | 'lbs'
type LengthUnit = 'cm' | 'inches'

type Props = object

export const UnitPreferencesSheet = forwardRef<BaseModalHandle, Props>((_, ref) => {
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null

  const updateUserDataMutation = useUpdateProfileMutation()
  const colors = useThemeColor()

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

  const handleSave = async () => {
    if (!hasChanges || !user?.id) {
      const modalRef = ref as React.RefObject<BaseModalHandle>
      modalRef.current?.dismiss()
      return
    }

    try {
      await updateUserDataMutation.mutateAsync({
        preferredWeightUnit: weightUnit,
        preferredLengthUnit: lengthUnit,
      })
      Toast.show({
        type: 'success',
        text1: 'Preferences updated',
      })
      const modalRef = ref as React.RefObject<BaseModalHandle>
      modalRef.current?.dismiss()
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update preferences',
      })
    }
  }

  const optionClass = (active: boolean, rounded?: string) =>
    [
      'w-1/2 py-2 border',
      rounded,
      active
        ? 'bg-blue-500 border-blue-500 text-white'
        : 'bg-white border-neutral-200/60 text-black dark:bg-neutral-900 dark:border-neutral-800 dark:text-white',
    ].join(' ')

  return (
    <BaseModal
      ref={ref}
      title="Unit Preferences"
      confirmAction={
        hasChanges
          ? {
              title: 'Save Changes',
              onPress: handleSave,
              loading: updateUserDataMutation.isPending,
            }
          : undefined
      }
      cancelAction={
        !hasChanges
          ? {
              title: 'Close',
              onPress: () => {
                const modalRef = ref as React.RefObject<BaseModalHandle>
                modalRef.current?.dismiss()
              },
            }
          : undefined
      }
      enableDynamicSizing={true}
    >
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
    </BaseModal>
  )
})

UnitPreferencesSheet.displayName = 'UnitPreferencesSheet'

export default UnitPreferencesSheet
