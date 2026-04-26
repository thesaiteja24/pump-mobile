import { useThemeColor } from '@/hooks/theme'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { Feather } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, useColorScheme, View } from 'react-native'
import Modal from 'react-native-modal'
import { PurchasesPackage } from 'react-native-purchases'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { Button } from '@/components/ui/buttons/Button'

interface PaywallProps {
  isVisible?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function Paywall({ isVisible = true, onSuccess, onCancel }: PaywallProps) {
  const scheme = useColorScheme()
  const colors = useThemeColor()

  const { offerings, isLoadingOfferings, isPurchasing, fetchOfferings, purchasePackage } =
    useSubscriptionStore()

  const [selected, setSelected] = useState<PurchasesPackage | null>(null)

  const getCTA = () => {
    if (!selected) return 'Continue'

    const id = selected.identifier

    if (id.includes('annual')) {
      return `Start Yearly Plan – ${selected.product.priceString}`
    }

    if (id.includes('monthly')) {
      return `Start Monthly Plan – ${selected.product.priceString}`
    }

    if (id.includes('lifetime')) {
      return `Unlock Lifetime – ${selected.product.priceString}`
    }

    return `Continue – ${selected.product.priceString}`
  }

  useEffect(() => {
    if (isVisible) {
      fetchOfferings()
    }
  }, [fetchOfferings, isVisible])

  useEffect(() => {
    if (offerings.length) {
      // default select yearly if exists
      const yearly = offerings.find((o) => o.identifier.includes('annual')) ?? offerings[0]
      setSelected(yearly)
    }
  }, [offerings])

  const handlePurchase = async () => {
    if (!selected) return

    try {
      const success = await purchasePackage(selected)

      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Welcome to Pro',
        })

        onSuccess?.()
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Toast.show({
          type: 'error',
          text1: 'Purchase failed',
          text2: error.message,
        })
      }
    }
  }

  const renderContent = () => {
    if (isLoadingOfferings) {
      return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )
    }

    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 justify-between bg-white px-6 pb-8 pt-10 dark:bg-black"
      >
        {/* HERO */}
        <View className="items-center px-4">
          <Text className="text-3xl font-extrabold text-black dark:text-white">
            Upgrade to <Text className="font-mon">PUMP </Text>Pro
          </Text>
        </View>

        <View className="flex-col items-center justify-center gap-2">
          {/* Each row */}
          <View className="w-56 flex-row items-start gap-2">
            <Feather name="check-circle" color={colors.icon} size={18} />
            <Text className="flex-1 text-base leading-6 text-zinc-500 dark:text-zinc-400">
              Unlock unlimited templates
            </Text>
          </View>

          <View className="w-56 flex-row items-start gap-2">
            <Feather name="check-circle" color={colors.icon} size={18} />
            <Text className="flex-1 text-base leading-6 text-zinc-500 dark:text-zinc-400">
              Advanced analytics
            </Text>
          </View>

          <View className="w-56 flex-row items-start gap-2">
            <Feather name="check-circle" color={colors.icon} size={18} />
            <Text className="flex-1 text-base leading-6 text-zinc-500 dark:text-zinc-400">
              AI training coach.
            </Text>
          </View>
        </View>

        {/* PRICING CARDS */}
        <View className="mt-6 gap-4">
          {offerings.map((pack) => {
            const isSelected = selected?.identifier === pack.identifier
            const monthlyPack = offerings.find((p) => p.identifier.includes('monthly'))

            const isYearly = pack.identifier.includes('annual')
            const isMonthly = pack.identifier.includes('monthly')
            const isLifetime = pack.identifier.includes('lifetime')

            const badge = isYearly ? 'SAVE 58%' : null

            return (
              <Pressable
                key={pack.identifier}
                onPress={() => setSelected(pack)}
                className={`relative rounded-2xl border p-5 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                {/* badge */}
                {badge && (
                  <View className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1">
                    <Text className="text-xs font-bold text-white">{badge}</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xl font-bold text-black dark:text-white">
                      {isYearly && '12 months'}
                      {isMonthly && '1 month'}
                      {isLifetime && 'Lifetime'}
                    </Text>

                    <Text className="mt-1 flex-row flex-wrap text-sm text-zinc-500 dark:text-zinc-400">
                      {isYearly && pack?.product && (
                        <>
                          Get Stronger for{' '}
                          {monthlyPack?.product?.pricePerWeek && (
                            <Text className="mr-2 text-zinc-400 line-through dark:text-zinc-600">
                              {`${(monthlyPack.product.pricePerWeek / 7).toLocaleString(undefined, {
                                style: 'currency',
                                currency: monthlyPack.product.currencyCode,
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                            </Text>
                          )}
                          {pack.product.price && (
                            <Text>
                              {` ${(pack.product.price / 365).toLocaleString(undefined, {
                                style: 'currency',
                                currency: pack.product.currencyCode,
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} per day`}
                            </Text>
                          )}
                        </>
                      )}

                      {/* Monthly fallback */}
                      {isMonthly &&
                        (pack?.product?.pricePerWeek
                          ? `Get Stronger for ${(pack.product.pricePerWeek / 7).toLocaleString(
                              undefined,
                              {
                                style: 'currency',
                                currency: pack.product.currencyCode,
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )} per day`
                          : 'Flexible monthly plan')}

                      {/* Lifetime */}
                      {isLifetime && 'Pay once, unlock forever'}
                    </Text>

                    <Text className="mt-2 text-lg font-semibold text-black dark:text-white">
                      {pack.product.priceString}
                    </Text>
                  </View>

                  {/* radio indicator */}
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-zinc-400 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-white" />}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* CTA */}
        <View className="mt-6">
          <Button
            title={getCTA()}
            onPress={handlePurchase}
            variant="primary"
            disabled={!selected || isPurchasing}
          />
          {/* 
					<Pressable onPress={() => restorePurchases()} className="mt-6 p-2">
						<Text className="text-center font-medium text-zinc-500 dark:text-zinc-400">
							Restore Purchases
						</Text>
					</Pressable> */}

          {onCancel && (
            <Pressable onPress={onCancel} className="mt-2 p-2">
              <Text className="text-center font-medium text-zinc-400 dark:text-zinc-500">
                Not now
              </Text>
            </Pressable>
          )}
        </View>

        {isPurchasing && (
          <View className="absolute inset-0 items-center justify-center bg-white/60 dark:bg-black/60">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}
      </SafeAreaView>
    )
  }

  return (
    <Modal
      isVisible={isVisible}
      style={{ margin: 0 }}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={1}
      backdropColor={scheme === 'dark' ? '#000' : '#fff'}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      {renderContent()}
    </Modal>
  )
}
