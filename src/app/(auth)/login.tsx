import PrivacyPolicyModal from '@/components/auth/PrivacyPolicyModal'
import { BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { useGoogleLoginMutation } from '@/hooks/queries/auth'
import {
  updateFitnessProfileService,
  updateMeService,
  updateNutritionPlanService,
} from '@/services/me.service'
import { useAuth } from '@/stores/auth.store'
import { useOnboarding } from '@/stores/me.store'
import { SelfUser } from '@/types/me'
import { calculateBMR, calculateDailyTargets, calculateTDEE } from '@/utils/analytics'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Pressable, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import GoogleIcon from '../../assets/components/icons/Google'

export default function Login() {
  const router = useRouter()
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState<string | null>(null)
  const privacyModalRef = useRef<BaseModalHandle>(null)
  const isGooglePending = useRef(false)

  const { mutate: googleLogin, isPending: isGoogleLoading } = useGoogleLoginMutation()

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const pumpScale = useSharedValue(0.8)

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    })
  }, [])

  const onGoogleButtonPress = async (versionOverride?: string | any) => {
    const version =
      typeof versionOverride === 'string' ? versionOverride : privacyPolicyVersion || '1.0'

    try {
      await GoogleSignin.hasPlayServices()
      await GoogleSignin.signOut()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken

      if (idToken) {
        googleLogin(
          { idToken, privacyAccepted: true, privacyPolicyVersion: version },
          {
            onSuccess: (data) => {
              handlePostLogin(data.user)
            },
            onError: (err: any) => {
              Toast.show({
                type: 'error',
                text1: err?.message || 'Google Login Failed',
              })
            },
          },
        )
      }
    } catch (error: any) {
      console.error(error)
    }
  }

  // Onboarding Store
  const { hasData, getPayload, reset: resetOnboarding } = useOnboarding.getState()
  const completeOnboarding = useAuth((s) => s.completeOnboarding)

  const handlePostLogin = async (user: SelfUser) => {
    // 1. Sync Onboarding Data if exists
    if (hasData()) {
      const onBoardingPayload = getPayload()

      const userData = {
        height: onBoardingPayload.height,
        weight: onBoardingPayload.weight,
        dateOfBirth: onBoardingPayload.dateOfBirth,
        gender: onBoardingPayload.gender as any,
      }
      const preferences = {
        preferredWeightUnit: onBoardingPayload.weightUnit as any,
        preferredLengthUnit: onBoardingPayload.heightUnit as any,
      }

      await updateMeService(userData)
      await updateMeService(preferences)

      if (onBoardingPayload.fitnessProfile) {
        const fp = onBoardingPayload.fitnessProfile

        // Compute targets
        const age =
          new Date().getFullYear() - new Date(onBoardingPayload.dateOfBirth!).getFullYear()
        const bmr = calculateBMR(
          Number(onBoardingPayload.weight),
          Number(onBoardingPayload.height),
          age,
          onBoardingPayload.gender as any,
        )
        const tdee = calculateTDEE(bmr, fp.activityLevel as any)

        const computedTargets = calculateDailyTargets({
          tdee,
          weightKg: Number(onBoardingPayload.weight),
          goal: fp.fitnessGoal as any,
          weeklyRateKg: Number(fp.weeklyWeightChange),
        })

        const fitnessPayload = {
          ...fp,
        }

        const nutritionPayload = {
          caloriesTarget: computedTargets.caloriesTarget,
          proteinTarget: computedTargets.proteinTarget,
          fatsTarget: computedTargets.fatsTarget,
          carbsTarget: computedTargets.carbsTarget,
          calculatedTDEE: computedTargets.caloriesTarget - computedTargets.deficitOrSurplus,
          deficitOrSurplus: computedTargets.deficitOrSurplus,
          startDate: new Date().toISOString(),
        }

        await Promise.all([
          updateFitnessProfileService(fitnessPayload),
          updateNutritionPlanService(nutritionPayload),
        ])
      }

      // Reset onboarding store
      resetOnboarding()
    }

    // 2. Mark onboarding as seen
    completeOnboarding()

    // 3. Redirect
    router.replace('/home')
  }

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 })
    translateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) })
    pumpScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [opacity, translateY, pumpScale])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const animatedPumpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pumpScale.value }],
    fontFamily: 'Monoton',
  }))

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-[2] justify-center px-6" />

      <Animated.View style={[animatedContainerStyle]} className="justify-center px-6">
        <Text className="text-5xl text-gray-500 dark:text-gray-400">
          Lock in today’s{' '}
          <Animated.Text
            style={[animatedPumpStyle]}
            className="text-4xl text-black dark:text-white"
          >
            PUMP
          </Animated.Text>{' '}
          Earn a bigger one tomorrow.
        </Text>
      </Animated.View>

      <KeyboardAvoidingView behavior="position" className="flex-[4] justify-center gap-4 px-6">
        <View className="mb-4 flex-row items-center justify-center gap-4 px-6">
          <View className="w-full border-t-[0.25px] border-gray-500 dark:border-gray-400"></View>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {hasData() ? 'Complete Signup' : 'Welcome Back'}
          </Text>
          <View className="w-full border-t-[0.25px] border-gray-500 dark:border-gray-400"></View>
        </View>
        <Button
          className=""
          title="Continue with Google"
          onPress={() => onGoogleButtonPress()}
          variant="ghost"
          disabled={!privacyAccepted}
          loading={isGoogleLoading}
          rightIcon={<GoogleIcon />}
          onDisabledPress={() => {
            isGooglePending.current = true
            privacyModalRef.current?.present()
          }}
        />
        <View className="mt-4 flex-row items-center justify-center gap-4 px-6">
          <Pressable
            onPress={() => {
              if (privacyAccepted) {
                setPrivacyAccepted(false)
                setPrivacyPolicyVersion(null)
              } else {
                isGooglePending.current = false
                privacyModalRef.current?.present()
              }
            }}
            className="flex-row items-center gap-2"
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded border ${
                privacyAccepted ? 'border-primary bg-primary' : 'border-gray-500 bg-transparent'
              }`}
            >
              {privacyAccepted && <Text className="text-xs font-bold text-white">✓</Text>}
            </View>
          </Pressable>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            I agree to the{' '}
            <Text
              className="text-primary underline"
              onPress={() => {
                isGooglePending.current = false
                privacyModalRef.current?.present()
              }}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
      <PrivacyPolicyModal
        ref={privacyModalRef}
        onAgree={(version) => {
          setPrivacyAccepted(true)
          const v = version || '1.0'
          setPrivacyPolicyVersion(v)

          if (isGooglePending.current) {
            isGooglePending.current = false
            onGoogleButtonPress(v)
          }
        }}
      />
    </SafeAreaView>
  )
}
