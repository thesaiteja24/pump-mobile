import { revenueCatService } from '@/services/subscriptions.service'
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases'
import { create } from 'zustand'
import { type SubscriptionState } from '@/types/subscriptions'

// In RevenueCat, you usually have an entitlement identifier. Replace 'pro' with your actual entitlement ID from the RC dashboard.
const ENTITLEMENT_ID = 'PUMP Pro'

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  offerings: [],
  isLoadingOfferings: false,
  isPurchasing: false,
  activeEntitlements: [],
  activePlanId: null,

  initialize: async () => {
    await revenueCatService.initialize()

    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      get().updateCustomerInfo(customerInfo)
    })

    const customerInfo = await revenueCatService.getCustomerInfo()
    if (customerInfo) {
      get().updateCustomerInfo(customerInfo)
    }
  },

  login: async (userId: string) => {
    const customerInfo = await revenueCatService.login(userId)
    if (customerInfo) {
      get().updateCustomerInfo(customerInfo)
    }
  },

  logout: async () => {
    await revenueCatService.logout()
    set({ isPro: false, activeEntitlements: [], activePlanId: null }) // Reset on logout
  },

  fetchOfferings: async () => {
    set({ isLoadingOfferings: true })
    try {
      const result = await revenueCatService.getOfferings()

      const offerings = result.sort((a, b) => {
        if (a.identifier.includes('monthly')) return -1
        if (b.identifier.includes('monthly')) return 1
        if (a.identifier.includes('annual')) return -1
        if (b.identifier.includes('annual')) return 1
        return 0
      })

      set({ offerings, isLoadingOfferings: false })
    } catch {
      set({ isLoadingOfferings: false })
    }
  },

  purchasePackage: async (pack: PurchasesPackage) => {
    set({ isPurchasing: true })
    try {
      const customerInfo = await revenueCatService.purchasePackage(pack)
      get().updateCustomerInfo(customerInfo)
      set({ isPurchasing: false })
      return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
    } catch {
      set({ isPurchasing: false })
      return false
    }
  },

  restorePurchases: async () => {
    set({ isPurchasing: true })
    try {
      const customerInfo = await revenueCatService.restorePurchases()
      get().updateCustomerInfo(customerInfo)
      set({ isPurchasing: false })
      return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
    } catch {
      set({ isPurchasing: false })
      return false
    }
  },

  updateCustomerInfo: (customerInfo: CustomerInfo) => {
    const activeEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID]
    const activeEntitlements = Object.keys(customerInfo.entitlements.active)
    const isPro = typeof activeEntitlement !== 'undefined'
    const activePlanId = activeEntitlement?.productIdentifier || null

    set({
      activeEntitlements,
      isPro,
      activePlanId,
    })
  },
}))
