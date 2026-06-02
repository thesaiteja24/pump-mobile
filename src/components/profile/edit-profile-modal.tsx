import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import React, { memo, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { Button } from '@/components/ui/button'
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { useUnitConverter } from '@/hooks/use-unit-converter'
import { Arise } from '@/lib/arise'
import { DateTimePicker } from '@/lib/datetimepicker'
import { parseDateOnly } from '@/lib/datetimepicker/utils'

import type { Gender, UserProfile } from '@/types/user'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'
import type { Control } from 'react-hook-form'

interface FormValues {
  firstName: string
  lastName: string
  height: string
  weight: string
  gender: Gender | ''
  dateOfBirth: Date | null
}

const GENDER_OPTIONS: { value: Gender, label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const OptionSelector = memo(({ value, onChange }: { value: Gender | '', onChange: (val: Gender) => void }) => {
  const { colors, spacing, radius, typography, layout } = useTheme()
  return (
    <View style={[layout.row, { flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }]}>
      {GENDER_OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: selected ? colors.text : colors.border,
              backgroundColor: selected ? colors.text : 'transparent',
            }}
          >
            <Text style={[typography.bodySmStrong, { color: selected ? colors.card : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})
OptionSelector.displayName = 'OptionSelector'

type StringFormField = 'firstName' | 'lastName' | 'height' | 'weight'

interface FormFieldProps {
  label: string
  name: StringFormField
  control: Control<FormValues>
  placeholder?: string
  keyboardType?: 'default' | 'decimal-pad'
  rules?: object
}

const FormField = memo(({ label, name, control, placeholder = '--', keyboardType = 'default', rules }: FormFieldProps) => {
  const { colors, spacing, typography, layout } = useTheme()
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md, marginBottom: spacing.md }}>
          <View style={[layout.rowAlign, layout.rowBetween]}>
            <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
            <BottomSheetTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType={keyboardType}
              style={[typography.bodyLg, { color: colors.text, textAlign: 'right', minWidth: 120 }]}
            />
          </View>
          {error && (
            <Text style={[typography.caption, { color: colors.danger, textAlign: 'right', marginTop: spacing.xxs }]}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  )
})
FormField.displayName = 'FormField'

function useEditProfileSubmit(onClose: () => void) {
  const updateProfile = useUpdateProfileMutation()
  const { toCanonicalLength, toCanonicalWeight } = useUnitConverter()

  const handleSave = (data: FormValues) => {
    const rawHeight = Number.parseFloat(data.height)
    const rawWeight = Number.parseFloat(data.weight)

    const heightVal = Number.isNaN(rawHeight) ? null : toCanonicalLength(rawHeight)
    const weightVal = Number.isNaN(rawWeight) ? null : toCanonicalWeight(rawWeight)

    // Serialize Date → YYYY-MM-DD at the API boundary (no UTC shift)
    const dob = data.dateOfBirth
    const dobVal = dob
      ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
      : null

    updateProfile.mutate(
      {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        height: heightVal,
        weight: weightVal,
        gender: data.gender === '' ? null : data.gender,
        dateOfBirth: dobVal,
      },
      {
        onSuccess: () => {
          Arise.success('Profile updated successfully!')
          onClose()
        },
        onError: (err) => {
          Arise.error(err.message || 'Failed to update profile.')
        },
      },
    )
  }

  return {
    onSubmit: handleSave,
    isPending: updateProfile.isPending,
  }
}

function getInitialValues(user: UserProfile | undefined, formatLength: (val: number) => number, formatWeight: (val: number) => number): FormValues {
  if (!user) {
    return { firstName: '', lastName: '', height: '', weight: '', gender: '', dateOfBirth: null }
  }
  return {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    height: user.height ? formatLength(user.height).toString() : '',
    weight: user.weight ? formatWeight(user.weight).toString() : '',
    gender: user.gender || '',
    // timezone-safe parse: treats date-only strings as local midnight
    dateOfBirth: parseDateOnly(user.dateOfBirth),
  }
}

const EditProfileForm = memo(({ onClose }: { onClose: () => void }) => {
  const { colors, spacing, radius, typography, layout } = useTheme()
  const { data: user } = useProfileQuery()
  const { formatLength, formatWeight, lengthUnit, weightUnit } = useUnitConverter()
  const { onSubmit, isPending } = useEditProfileSubmit(onClose)

  const { control, handleSubmit, reset, formState: { isValid, isDirty } } = useForm<FormValues>({
    defaultValues: getInitialValues(user, formatLength, formatWeight),
    mode: 'onChange',
  })

  useEffect(() => {
    reset(getInitialValues(user, formatLength, formatWeight))
  }, [user, reset, formatLength, formatWeight])

  const maxDob = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 12)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  return (
    <View style={layout.flex1}>
      <BottomSheetScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
        <FormField label="First Name" name="firstName" control={control} rules={{ required: 'First name is required' }} />
        <FormField label="Last Name" name="lastName" control={control} rules={{ required: 'Last name is required' }} />
        <FormField label={`Height (${lengthUnit})`} name="height" control={control} keyboardType="decimal-pad" rules={{ validate: (v: string) => !v || !Number.isNaN(Number.parseFloat(v)) || 'Invalid number' }} />
        <FormField label={`Weight (${weightUnit})`} name="weight" control={control} keyboardType="decimal-pad" rules={{ validate: (v: string) => !v || !Number.isNaN(Number.parseFloat(v)) || 'Invalid number' }} />
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { value, onChange } }) => (
            <DateTimePicker
              label="Date of Birth"
              value={value}
              onChange={date => onChange(date ?? null)}
              mode="date"
              showToday={false}
              maximumDate={maxDob}
            />
          )}
        />

        <Text style={[typography.bodySmStrong, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm }]}>Gender</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <OptionSelector value={value} onChange={onChange} />
          )}
        />
      </BottomSheetScrollView>

      <View style={[layout.row, { gap: spacing.md, marginTop: spacing.lg }]}>
        <Button leftIcon={<Ionicons name="close" size={24} color={colors.text} />} variant="outline" size="sm" onPress={onClose} />
        <Button title="Save Profile" style={[layout.flex1, { borderRadius: radius.full }]} size="sm" loading={isPending} disabled={!isValid || !isDirty} onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  )
})
EditProfileForm.displayName = 'EditProfileForm'

export const EditProfileModal = memo(
  ({ ref }: { ref?: React.RefObject<BottomSheetMethods | null> }) => {
    const { colors, spacing, typography } = useTheme()
    const handleClose = () => {
      if (ref && ref.current) {
        ref.current.dismiss()
      }
    }

    return (
      <BottomSheetModal ref={ref} enableDynamicSizing enablePanDownToClose={false} backgroundStyle={{ backgroundColor: colors.card }}>
        <BottomSheetView style={{ padding: spacing.lg }}>
          <Text style={[typography.displaySm, { color: colors.text, marginBottom: spacing.sm }]}>Edit Profile</Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            Update your personal profile details.
          </Text>
          <EditProfileForm onClose={handleClose} />
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)
EditProfileModal.displayName = 'EditProfileModal'
export default EditProfileModal
