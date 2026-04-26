import { Button } from '@/components/ui/buttons/Button'
import { GlassBackground } from '@/components/ui/GlassBackground'
import { PaywallModal, PaywallModalHandle } from '@/components/ui/modals/PaywallModal'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { Program, UserProgram } from '@/types/programs'
import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface StartProgramSheetHandle {
  present: () => void
  dismiss: () => void
}

interface StartProgramSheetProps {
  program: Program
  activeProgram: UserProgram | null
  onConfirm: (duration: number) => Promise<void>
  isLoading?: boolean
}

export const StartProgramSheet = forwardRef<StartProgramSheetHandle, StartProgramSheetProps>(
  ({ program, activeProgram, onConfirm, isLoading }, ref) => {
    const isDark = useColorScheme() === 'dark'
    const insets = useSafeAreaInsets()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const paywallModalRef = useRef<PaywallModalHandle>(null)

    const isPro = useSubscriptionStore((s) => s.isPro)

    const [selectedDuration, setSelectedDuration] = useState(4)
    const [planType, setPlanType] = useState<'regular' | 'personalised'>('regular')

    const durations = [4, 6, 8, 10, 12, 14, 16]

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetModalRef.current?.present(),
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }))

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    )

    const handleDurationSelect = (weeks: number) => {
      if (weeks > 8 && !isPro) {
        paywallModalRef.current?.present()
        return
      }
      setSelectedDuration(weeks)
    }

    const handlePlanTypeSelect = (type: 'regular' | 'personalised') => {
      if (type === 'personalised') {
        if (!isPro) {
          paywallModalRef.current?.present()
        } else {
          // Pro but coming soon
          // For now, user said "may be use paywall modal instead of toast"
          // I'll show the paywall modal but with special text if they are already pro?
          // Actually, the user's remark "personalised is an pro feature but for now show a modal saying it is still coming"
          // and "may be use paywall modal instead of toast"
          // I'll use a local state to show a "Coming Soon" variant of a modal.
          setComingSoonVisible(true)
        }
        return
      }
      setPlanType(type)
    }

    const [comingSoonVisible, setComingSoonVisible] = useState(false)

    return (
      <>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          backdropComponent={renderBackdrop}
          enableDynamicSizing
          backgroundComponent={GlassBackground}
          handleIndicatorStyle={{
            backgroundColor: isDark ? '#525252' : '#d1d5db',
          }}
        >
          <BottomSheetScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            className="px-6 pt-2"
          >
            <Text className="text-center text-2xl font-bold text-black dark:text-white">
              Ready to start?
            </Text>
            <Text className="mt-2 text-center text-neutral-500">
              {`Choose your duration and plan type to activate "${program.title}"`}
            </Text>

            {/* Duration Selection */}
            <View className="mt-8">
              <Text className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-400">
                Duration
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {durations.map((weeks) => {
                  const locked = weeks > 8 && !isPro
                  const selected = selectedDuration === weeks
                  return (
                    <SelectableCard
                      key={weeks}
                      selected={selected}
                      onSelect={() => handleDurationSelect(weeks)}
                      title={`${weeks} Weeks`}
                      className="basis-[31%] py-3"
                    >
                      {locked && (
                        <View className="absolute bottom-1 right-1">
                          <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                        </View>
                      )}
                    </SelectableCard>
                  )
                })}
              </View>
            </View>

            {/* Plan Type Selection */}
            <View className="mt-8">
              <Text className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-400">
                Plan Type
              </Text>
              <View className="flex-row gap-3">
                <SelectableCard
                  selected={planType === 'regular'}
                  onSelect={() => handlePlanTypeSelect('regular')}
                  title="Regular"
                  className="flex-1"
                />
                <SelectableCard
                  selected={planType === 'personalised'}
                  onSelect={() => handlePlanTypeSelect('personalised')}
                  title="Personalised ✨"
                  className="flex-1"
                >
                  {!isPro && (
                    <View className="absolute bottom-1 right-1">
                      <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                    </View>
                  )}
                </SelectableCard>
              </View>
            </View>

            {/* Conflict Warning */}
            {activeProgram && (
              <View className="mt-8 rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="warning" size={20} color="#d97706" />
                  <Text className="font-bold text-amber-800 dark:text-amber-200">
                    Active Program Found
                  </Text>
                </View>
                <Text className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  {`Starting this will pause "${activeProgram.program.title}". You can resume it later from your library.`}
                </Text>
              </View>
            )}

            {/* Action Button */}
            <Button
              title={activeProgram ? 'Confirm & Override' : 'Start Program'}
              variant="primary"
              className="mt-8"
              onPress={() => onConfirm(selectedDuration)}
              loading={isLoading}
              liquidGlass
            />
          </BottomSheetScrollView>
        </BottomSheetModal>

        <PaywallModal
          ref={paywallModalRef}
          title="Pro Duration Option"
          description="Upgrade to Pro to unlock longer program durations (10-16 weeks) and personalized adjustments."
        />

        {/* Coming Soon Modal (using Paywall style as requested) */}
        <PaywallModal
          ref={(ref) => {
            // This is a bit of a hack to reuse PaywallModal for Coming Soon
            // but I'll implement a simple one if needed.
            // Use component below instead for clarity.
          }}
          // Actually, I'll just use a local modal here for Coming Soon.
        />

        {comingSoonVisible && <ComingSoonModal onDismiss={() => setComingSoonVisible(false)} />}
      </>
    )
  },
)

function ComingSoonModal({ onDismiss }: { onDismiss: () => void }) {
  const insets = useSafeAreaInsets()
  const modalRef = useRef<BottomSheetModal>(null)

  React.useEffect(() => {
    modalRef.current?.present()
  }, [])

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      stackBehavior="push"
      onDismiss={onDismiss}
      backgroundComponent={GlassBackground}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 24 }} className="px-6 pt-2">
        <Text className="text-center text-xl font-bold dark:text-white">Coming Soon ✨</Text>
        <Text className="mt-3 text-center text-base text-neutral-500">
          Personalized programs are being polished for a perfect experience. We&apos;ll notify you
          as soon as they&apos;re live!
        </Text>
        <Button
          title="Got it"
          variant="primary"
          className="mt-8"
          onPress={() => modalRef.current?.dismiss()}
          liquidGlass
        />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

StartProgramSheet.displayName = 'StartProgramSheet'
