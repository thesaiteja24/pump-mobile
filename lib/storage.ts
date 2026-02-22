import { createMMKV } from 'react-native-mmkv'
import { createJSONStorage, StateStorage } from 'zustand/middleware'

// Create a shared MMKV instance
export const storage = createMMKV({
	id: 'pump-app-storage',
})

// Raw MMKV storage adapter
const mmkvStorage: StateStorage = {
	setItem: (name, value) => {
		storage.set(name, value)
	},
	getItem: name => {
		const value = storage.getString(name)
		return value ?? null
	},
	removeItem: name => {
		storage.remove(name)
	},
}

// Zustand persist storage adapter (with JSON serialization)
export const zustandStorage = createJSONStorage(() => mmkvStorage)
