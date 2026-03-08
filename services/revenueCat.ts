import { Platform } from 'react-native'
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases'

// Replace with your actual RevenueCat API keys or environment variables
const API_KEYS = {
	apple: process.env.EXPO_PUBLIC_RC_IOS_KEY || 'mock_apple_key',
	google: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'mock_google_key',
}

export const revenueCatService = {
	async initialize() {
		try {
			Purchases.setLogLevel(LOG_LEVEL.INFO)

			if (Platform.OS === 'ios') {
				await Purchases.configure({ apiKey: API_KEYS.apple })
			} else if (Platform.OS === 'android') {
				await Purchases.configure({ apiKey: API_KEYS.google })
			}
		} catch (error) {
			console.error('Failed to initialize RevenueCat:', error)
		}
	},

	async login(appUserId: string) {
		try {
			const { customerInfo } = await Purchases.logIn(appUserId)
			return customerInfo
		} catch (error) {
			console.error('Failed to login to RevenueCat:', error)
			return null
		}
	},

	async logout() {
		try {
			await Purchases.logOut()
		} catch (error) {
			console.error('Failed to logout from RevenueCat:', error)
		}
	},

	async getOfferings() {
		try {
			const offerings = await Purchases.getOfferings()
			if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
				return offerings.current.availablePackages
			}
			return []
		} catch (error) {
			console.error('Failed to get offerings:', error)
			return []
		}
	},

	async purchasePackage(pack: PurchasesPackage) {
		try {
			const { customerInfo } = await Purchases.purchasePackage(pack)
			return customerInfo
		} catch (error: any) {
			if (!error.userCancelled) {
				console.error('Failed to purchase package:', error)
			}
			throw error
		}
	},

	async restorePurchases() {
		try {
			const customerInfo = await Purchases.restorePurchases()
			return customerInfo
		} catch (error) {
			console.error('Failed to restore purchases:', error)
			throw error
		}
	},

	async getCustomerInfo() {
		try {
			const customerInfo = await Purchases.getCustomerInfo()
			return customerInfo
		} catch (error) {
			console.error('Failed to get customer info:', error)
			return null
		}
	},
}
