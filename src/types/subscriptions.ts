import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases'

export interface SubscriptionState {
  isPro: boolean
  offerings: PurchasesPackage[]
  isLoadingOfferings: boolean
  isPurchasing: boolean
  activeEntitlements: string[]
  activePlanId: string | null

  initialize: () => Promise<void>
  fetchOfferings: () => Promise<void>
  purchasePackage: (pack: PurchasesPackage) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
  updateCustomerInfo: (customerInfo: CustomerInfo) => void
  login: (userId: string) => Promise<void>
  logout: () => Promise<void>
}
