import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useEffect, useRef } from 'react'
import { BackHandler, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { UserEditProfileModal } from '@/components/modals/UserEditProfileModal'
import { UserFitnessGoalsModal } from '@/components/modals/UserFitnessGoalsModal'
import { UserMeasurementsModal } from '@/components/modals/UserMeasurementsModal'
import { UserUnitPreferencesModal } from '@/components/modals/UserUnitPreferencesModal'
import { BaseModalHandle } from '@/components/ui/BaseModal'
import { UserHeader } from '@/components/user/UserHeader'
import { UserMenuItem } from '@/components/user/UserMenuItem'
import { UserThemeToggle } from '@/components/user/UserThemeToggle'
import { useProfileQuery } from '@/hooks/queries/me'
import { useAuth } from '@/stores/auth.store'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { SelfUser } from '@/types/me'

export default function ProfileScreen() {
  const router = useRouter()
  const logout = useAuth((s) => s.logout)
  const { data: userData } = useProfileQuery()
  const user = userData as SelfUser | null

  const { isPro, activePlanId } = useSubscriptionStore()
  const { colorScheme } = useColorScheme()
  const isDarkMode = colorScheme === 'dark'
  const insets = useSafeAreaInsets()

  const unitSheetRef = useRef<BaseModalHandle>(null)
  const editProfileSheetRef = useRef<BaseModalHandle>(null)
  const measurementsSheetRef = useRef<BaseModalHandle>(null)
  const fitnessGoalsSheetRef = useRef<BaseModalHandle>(null)

  // Animation Values
  const avatarOpacity = useSharedValue(0)
  const avatarScale = useSharedValue(0.8)

  const nameOpacity = useSharedValue(0)
  const nameTranslateY = useSharedValue(15)

  const infoOpacity = useSharedValue(0)
  const infoTranslateY = useSharedValue(20)

  useEffect(() => {
    // 1. Avatar: Fade In + Scale Up
    avatarOpacity.value = withTiming(1, { duration: 500 })

    // 2. Name: Fade In + Slide Up (delayed 100ms)
    nameOpacity.value = withDelay(100, withTiming(1, { duration: 500 }))
    nameTranslateY.value = withDelay(
      100,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    )

    // 3. Info Card: Fade In + Slide Up (delayed 200ms)
    infoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }))
    infoTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    )
  }, [avatarOpacity, infoOpacity, infoTranslateY, nameOpacity, nameTranslateY])

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }))

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }))

  const infoStyle = useAnimatedStyle(() => ({
    opacity: infoOpacity.value,
    transform: [{ translateY: infoTranslateY.value }],
  }))

  useEffect(() => {
    const onBackPress = () => {
      try {
        if (router.canGoBack()) {
          router.back()
        } else {
          router.push('/(app)/(tabs)/home')
        }
      } catch (e) {
        // Fallback if navigation context is lost during transition
        console.warn('Navigation error in BackHandler:', e)
      }
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

    return () => subscription.remove()
  }, [router])


  return (
    <View className="flex-1 bg-white p-4 dark:bg-black" style={{ paddingBottom: insets.bottom }}>
      <UserHeader
        user={user}
        isPro={isPro}
        activePlanId={activePlanId}
        avatarStyle={avatarStyle}
        nameStyle={nameStyle}
      />

      {/* Info Card / Action List */}
      <Animated.View style={infoStyle} className="mt-4 gap-2">
        <UserMenuItem
          title="Account Details"
          onPress={() => editProfileSheetRef.current?.present()}
          leftIcon={
            <MaterialCommunityIcons
              name="account-edit"
              size={24}
              color={isDarkMode ? '#D4D4D4' : '#525252'}
              className="mr-2"
            />
          }
        />

        <View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

        <UserMenuItem
          title="Measurements"
          onPress={() => measurementsSheetRef.current?.present()}
          leftIcon={
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={24}
              color={isDarkMode ? '#D4D4D4' : '#525252'}
              className="mr-2"
            />
          }
        />

        <View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

        <UserMenuItem
          title="Fitness Goals"
          onPress={() => fitnessGoalsSheetRef.current?.present()}
          leftIcon={
            <MaterialCommunityIcons
              name="bullseye-arrow"
              size={24}
              color={isDarkMode ? '#D4D4D4' : '#525252'}
              className="mr-2"
            />
          }
        />

        <View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

        <UserMenuItem
          title="Unit Preferences"
          onPress={() => unitSheetRef.current?.present()}
          leftIcon={
            <MaterialCommunityIcons
              name="tune-variant"
              size={24}
              color={isDarkMode ? '#D4D4D4' : '#525252'}
              className="mr-2"
            />
          }
        />

        <View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

        <UserThemeToggle />

        <View className="ml-14 h-[1px] bg-neutral-100 dark:bg-neutral-800" />

        <UserMenuItem
          title="Logout"
          onPress={logout}
          isDestructive
          leftIcon={
            <AntDesign
              name="logout"
              size={22}
              color={isDarkMode ? '#EF4444' : '#DC2626'}
              className="ml-[2px] mr-2"
            />
          }
        />
      </Animated.View>

      <UserUnitPreferencesModal ref={unitSheetRef} />
      <UserEditProfileModal ref={editProfileSheetRef} />
      <UserMeasurementsModal ref={measurementsSheetRef} />
      <UserFitnessGoalsModal ref={fitnessGoalsSheetRef} />
    </View>
  )
}
