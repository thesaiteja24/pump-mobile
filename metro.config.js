const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

try {
	const { withNativeWind } = require('nativewind/metro')
	module.exports = withNativeWind(config, { input: './app/globals.css' })
} catch (error) {
	console.warn('NativeWind metro config not available, using default config')
	module.exports = config
}
