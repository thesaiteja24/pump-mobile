import { PaywallModal } from '@/components/subscriptions/PaywallModal'
import { BaseModal, BaseModalHandle } from '@/components/ui/BaseModal'
import { Button } from '@/components/ui/buttons/Button'
import { SelectableCard } from '@/components/ui/SelectableCard'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { Program, UserProgram } from '@/types/programs'
import { Ionicons } from '@expo/vector-icons'
import { forwardRef, useRef, useState } from 'react'
import { Text, View } from 'react-native'

interface StartProgramSheetProps {
  program: Program
  activeProgram: UserProgram | null
  onConfirm: (duration: number) => Promise<void>
  isLoading?: boolean
}

export const StartProgramSheet = forwardRef<BaseModalHandle, StartProgramSheetProps>(
  ({ program, activeProgram, onConfirm, isLoading }, ref) => {
    const paywallModalRef = useRef<BaseModalHandle>(null)
    const comingSoonRef = useRef<BaseModalHandle>(null)

    const isPro = useSubscriptionStore((s) => s.isPro)

    const [selectedDuration, setSelectedDuration] = useState(4)
    const [planType, setPlanType] = useState<'regular' | 'personalised'>('regular')

    const durations = [4, 6, 8, 10, 12, 14, 16]

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
          comingSoonRef.current?.present()
        }
        return
      }
      setPlanType(type)
    }

    return (
      <>
        <BaseModal ref={ref} title="Ready to start?">
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
          />
        </BaseModal>

        <PaywallModal
          ref={paywallModalRef}
          title="Pro Duration Option"
          description="Upgrade to Pro to unlock longer program durations (10-16 weeks) and personalized adjustments."
        />

        <ComingSoonModal ref={comingSoonRef} />
      </>
    )
  },
)

const ComingSoonModal = forwardRef<BaseModalHandle>((_, ref) => {
  return (
    <BaseModal ref={ref} title="Coming Soon ✨" enableDynamicSizing={true}>
      <View className="pt-2">
        <Text className="text-center text-base text-neutral-500">
          Personalized programs are being polished for a perfect experience. We&apos;ll notify you
          as soon as they&apos;re live!
        </Text>
        <Button
          title="Got it"
          variant="primary"
          className="mt-8"
          onPress={() => {
            // @ts-ignore
            ref?.current?.dismiss()
          }}
        />
      </View>
    </BaseModal>
  )
})

StartProgramSheet.displayName = 'StartProgramSheet'
ComingSoonModal.displayName = 'ComingSoonModal'
