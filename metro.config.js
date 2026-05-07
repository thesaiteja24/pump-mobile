const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

try {
  const { withNativeWind } = require('nativewind/metro')
  module.exports = withNativeWind(config, { input: './src/app/globals.css' })
} catch (error) {
  console.error('NativeWind metro config not available, using default config', error)
  module.exports = config
}
