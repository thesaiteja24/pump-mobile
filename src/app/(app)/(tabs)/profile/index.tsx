import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { memo, useRef } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { FitnessProfileModal } from '@/components/profile/fitness-profile-modal'
import { MeasurementsModal } from '@/components/profile/measurements-modal'
import { NutritionPlanModal } from '@/components/profile/nutrition-plan-modal'
import { ProfileCard } from '@/components/profile/profile-card'
import { BaseScreen } from '@/components/ui/base-screen'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/queries/use-user'
import { useTheme } from '@/hooks/use-theme'
import { useAuthStore } from '@/stores/auth-store'

import type { ThemePreference } from '@/config/tokens'
import type { BottomSheetMethods } from '@expo/ui/community/bottom-sheet'

interface ProfileActionsProps {
  onEditProfile: () => void
  onAddMeasurements: () => void
  onUpdateNutrition: () => void
  onFitnessProfile: () => void
}

const ProfileActions = memo(({ onEditProfile, onAddMeasurements, onUpdateNutrition, onFitnessProfile }: ProfileActionsProps) => {
  const { colors, spacing, typography, layout } = useTheme()
  const { data: user } = useProfileQuery()
  const updateProfile = useUpdateProfileMutation()

  const weightUnit = user?.preferredWeightUnit || 'kg'
  const lengthUnit = user?.preferredLengthUnit || 'cm'

  const weightIcon = weightUnit === 'kg' ? 'weight-kilogram' : 'weight-pound'
  const lengthIcon = lengthUnit === 'cm' ? 'ruler' : 'tape-measure'

  return (
    <Card>
      <Button
        variant="ghost"
        title="Edit Profile"
        leftIcon={<Ionicons name="person" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />}
        style={{ justifyContent: 'flex-start', paddingHorizontal: 0, width: '100%' }}
        textStyle={[typography.bodyStrong, { color: colors.text }]}
        onPress={onEditProfile}
      />
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
      <Button
        variant="ghost"
        title="Add Measurements"
        leftIcon={<Ionicons name="body" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />}
        style={{ justifyContent: 'flex-start', paddingHorizontal: 0, width: '100%' }}
        textStyle={[typography.bodyStrong, { color: colors.text }]}
        onPress={onAddMeasurements}
      />
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
      <Button
        variant="ghost"
        title="Update Nutrition Plan"
        leftIcon={<Ionicons name="restaurant" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />}
        style={{ justifyContent: 'flex-start', paddingHorizontal: 0, width: '100%' }}
        textStyle={[typography.bodyStrong, { color: colors.text }]}
        onPress={onUpdateNutrition}
      />
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
      <Button
        variant="ghost"
        title="Fitness Profile"
        leftIcon={<Ionicons name="barbell" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />}
        style={{ justifyContent: 'flex-start', paddingHorizontal: 0, width: '100%' }}
        textStyle={[typography.bodyStrong, { color: colors.text }]}
        onPress={onFitnessProfile}
      />

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />

      {/* Weight Preference Unit Toggle */}
      <View style={[layout.rowAlign, layout.rowBetween, { paddingVertical: spacing.xxs }]}>
        <View style={[layout.rowAlign, { gap: spacing.sm }]}>
          <MaterialCommunityIcons name={weightIcon} size={20} color={colors.text} />
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Weight Unit</Text>
        </View>
        <SegmentedControl
          values={['kg', 'lbs']}
          selectedIndex={weightUnit === 'kg' ? 0 : 1}
          onValueChange={(val) => {
            updateProfile.mutate({ preferredWeightUnit: val as 'kg' | 'lbs' })
          }}
          style={{ width: 110 }}
        />
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />

      {/* Length Preference Unit Toggle */}
      <View style={[layout.rowAlign, layout.rowBetween, { paddingVertical: spacing.xxs }]}>
        <View style={[layout.rowAlign, { gap: spacing.sm }]}>
          <MaterialCommunityIcons name={lengthIcon} size={20} color={colors.text} />
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Length Unit</Text>
        </View>
        <SegmentedControl
          values={['cm', 'inches']}
          selectedIndex={lengthUnit === 'cm' ? 0 : 1}
          onValueChange={(val) => {
            updateProfile.mutate({ preferredLengthUnit: val as 'cm' | 'inches' })
          }}
          style={{ width: 110 }}
        />
      </View>
    </Card>
  )
})
ProfileActions.displayName = 'ProfileActions'

const ThemeSelector = memo(() => {
  const { colors, spacing, typography, preference, setTheme } = useTheme()
  const themeValues: ThemePreference[] = ['light', 'dark', 'system']
  const themeLabels = ['Light', 'Dark', 'System']
  const selectedThemeIndex = themeValues.indexOf(preference)

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.bodySmStrong, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
        App Theme
      </Text>
      <SegmentedControl
        values={themeLabels}
        selectedIndex={selectedThemeIndex >= 0 ? selectedThemeIndex : 2}
        onValueChange={(val) => {
          setTheme(val.toLowerCase() as ThemePreference)
        }}
      />
    </View>
  )
})
ThemeSelector.displayName = 'ThemeSelector'

export function ProfileScreen() {
  const { colors, layout, spacing, radius } = useTheme()
  const { data: user, isLoading } = useProfileQuery()
  const clearSession = useAuthStore(state => state.clearSession)
  const router = useRouter()

  const editProfileModalRef = useRef<BottomSheetMethods | null>(null)
  const measurementsModalRef = useRef<BottomSheetMethods | null>(null)
  const nutritionModalRef = useRef<BottomSheetMethods | null>(null)
  const fitnessModalRef = useRef<BottomSheetMethods | null>(null)

  const handleLogout = () => {
    clearSession().catch(() => {})
    router.replace('/(auth)/login')
  }

  if (isLoading || !user) {
    return (
      <BaseScreen scrollable>
        <View style={[layout.flex1, layout.center, { paddingTop: 100 }]}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </BaseScreen>
    )
  }

  return (
    <BaseScreen title="Profile" scrollable>
      <View style={{ gap: spacing.lg }}>
        <ProfileCard
          id={user.id}
          imageUrl={user.profilePicUrl}
          firstName={user.firstName}
          lastName={user.lastName}
          workoutsCount={user.workoutsCount}
          followersCount={user.followersCount}
          followingCount={user.followingCount}
          proSubscriptionType={user.proSubscriptionType}
          isPro={user.isPro}
          isSelf
        />

        <ProfileActions
          onEditProfile={() => editProfileModalRef.current?.present()}
          onAddMeasurements={() => measurementsModalRef.current?.present()}
          onUpdateNutrition={() => nutritionModalRef.current?.present()}
          onFitnessProfile={() => fitnessModalRef.current?.present()}
        />

        <ThemeSelector />

        <Button
          title="Logout"
          variant="danger"
          style={[layout.wFull, { borderRadius: radius.full, marginTop: spacing.md }]}
          onPress={handleLogout}
        />
      </View>

      <EditProfileModal ref={editProfileModalRef} />
      <MeasurementsModal ref={measurementsModalRef} />
      <NutritionPlanModal ref={nutritionModalRef} />
      <FitnessProfileModal ref={fitnessModalRef} />
    </BaseScreen>
  )
}

export default memo(ProfileScreen)
