import { revenueCatService } from '@/services/revenueCat'
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases'
import { create } from 'zustand'

interface SubscriptionState {
	isPro: boolean
	offerings: PurchasesPackage[]
	isLoadingOfferings: boolean
	isPurchasing: boolean
	activeEntitlements: string[]

	initialize: () => Promise<void>
	fetchOfferings: () => Promise<void>
	purchasePackage: (pack: PurchasesPackage) => Promise<boolean>
	restorePurchases: () => Promise<boolean>
	updateCustomerInfo: (customerInfo: CustomerInfo) => void
	login: (userId: string) => Promise<void>
	logout: () => Promise<void>
}

// In RevenueCat, you usually have an entitlement identifier. Replace 'pro' with your actual entitlement ID from the RC dashboard.
const ENTITLEMENT_ID = 'pro'

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
	isPro: false,
	offerings: [],
	isLoadingOfferings: false,
	isPurchasing: false,
	activeEntitlements: [],

	initialize: async () => {
		await revenueCatService.initialize()

		Purchases.addCustomerInfoUpdateListener(customerInfo => {
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
		set({ isPro: false, activeEntitlements: [] }) // Reset on logout
	},

	fetchOfferings: async () => {
		set({ isLoadingOfferings: true })
		try {
			const offerings = await revenueCatService.getOfferings()
			set({ offerings, isLoadingOfferings: false })
		} catch (error) {
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
		} catch (error) {
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
		} catch (error) {
			set({ isPurchasing: false })
			return false
		}
	},

	updateCustomerInfo: (customerInfo: CustomerInfo) => {
		const activeEntitlements = Object.keys(customerInfo.entitlements.active)
		const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'

		set({
			activeEntitlements,
			isPro,
		})
	},
}))
