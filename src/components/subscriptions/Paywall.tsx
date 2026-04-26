import { useThemeColor } from '@/hooks/theme'
import { useSubscriptionStore } from '@/stores/subscriptions.store'
import { Feather } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
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

  if (isLoadingOfferings) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 justify-between px-6 pb-8 pt-10"
      style={{ backgroundColor: colors.background }}
    >
      {/* HERO */}
      <View className="items-center px-4">
        <Text className="text-3xl font-extrabold" style={{ color: colors.text }}>
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
              style={{
                backgroundColor: isSelected
                  ? colors.isDark
                    ? 'rgba(59, 130, 246, 0.1)'
                    : '#eff6ff'
                  : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
              className="relative rounded-2xl border p-5"
            >
              {/* badge */}
              {badge && (
                <View className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1">
                  <Text className="text-xs font-bold text-white">{badge}</Text>
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>
                    {isYearly && '12 months'}
                    {isMonthly && '1 month'}
                    {isLifetime && 'Lifetime'}
                  </Text>

                  <Text
                    className="mt-1 flex-row flex-wrap text-sm"
                    style={{ color: colors.neutral[500] }}
                  >
                    {isYearly && pack?.product && (
                      <Text>
                        Get Stronger for{' '}
                        {monthlyPack?.product?.pricePerWeek && (
                          <Text
                            style={{
                              color: colors.neutral[colors.isDark ? 700 : 300],
                              textDecorationLine: 'line-through',
                            }}
                          >
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
                      </Text>
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

                  <Text className="mt-2 text-lg font-semibold" style={{ color: colors.text }}>
                    {pack.product.priceString}
                  </Text>
                </View>

                {/* radio indicator */}
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    isSelected ? 'bg-blue-500' : ''
                  }`}
                  style={{
                    borderColor: isSelected
                      ? colors.primary
                      : colors.neutral[colors.isDark ? 600 : 400],
                  }}
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

        {onCancel && (
          <Pressable onPress={onCancel} className="mt-2 p-2">
            <Text
              className="text-center font-medium"
              style={{ color: colors.neutral[colors.isDark ? 500 : 400] }}
            >
              Not now
            </Text>
          </Pressable>
        )}
      </View>

      {isPurchasing && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{
            backgroundColor: colors.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  )
}
