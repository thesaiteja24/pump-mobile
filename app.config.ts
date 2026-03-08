import type { ExpoConfig } from 'expo/config'

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
	const env = process.env.APP_ENV ?? 'development'
	const isProd = env === 'production'

	return {
		name: isProd ? 'PUMP' : 'PUMP (Dev)',
		slug: isProd ? 'pump' : 'pump-dev',
		version: '0.1.0',
		orientation: 'portrait',
		icon: isProd ? './assets/images/icon.png' : './assets/images/icon.png',
		scheme: isProd ? 'pump' : 'pump-dev',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,

		ios: {
			supportsTablet: true,
			bundleIdentifier: isProd ? 'com.thesaiteja.pump' : 'com.thesaiteja.pump.dev',
			associatedDomains: ['applinks:pump.thesaiteja.dev'],
		},

		android: {
			package: isProd ? 'com.thesaiteja.pump' : 'com.thesaiteja.pump.dev',
			versionCode: 1,
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#FFFFFF',
			},
			intentFilters: [
				{
					action: 'VIEW',
					autoVerify: true,
					data: [
						{
							scheme: 'https',
							host: 'pump.thesaiteja.dev',
							pathPrefix: '/share',
						},
					],
					category: ['BROWSABLE', 'DEFAULT'],
				},
			],
		},

		web: {
			output: 'static',
			favicon: './assets/images/favicon.png',
		},

		plugins: [
			'expo-router',
			[
				'expo-build-properties',
				{
					android: {
						enableProguardInReleaseBuilds: true,
						extraProguardRules:
							'-keep class coil3.** { *; }\n-dontwarn coil3.**\n-dontwarn com.google.api.client.**\n-dontwarn org.joda.time.**\n-dontwarn com.google.crypto.tink.**',
					},
				},
			],
			[
				'expo-splash-screen',
				{
					image: './assets/images/splash-icon-light.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#ffffff',
					dark: {
						image: './assets/images/splash-icon-dark.png',
						backgroundColor: '#000000',
					},
				},
			],
			'expo-font',
			'@react-native-community/datetimepicker',
			'expo-audio',
			'expo-asset',
			[
				'@react-native-google-signin/google-signin',
				{
					iosUrlScheme: 'com.googleusercontent.apps.42376320083-o9bm2pl7vt7iag9mlt16idqqflcdc8b4',
				},
			],
			'expo-video',
		],

		experiments: {
			typedRoutes: true,
			reactCompiler: true,
		},

		extra: {
			APP_ENV: env,
			isProd,
			router: {},
			eas: {
				projectId: '46384027-b755-4a49-9a73-31783f8b85fe',
			},
		},

		owner: 'thesaiteja',

		runtimeVersion: {
			policy: 'sdkVersion',
		},

		updates: {
			checkAutomatically: 'NEVER',
			fallbackToCacheTimeout: 0,
			url: 'https://u.expo.dev/46384027-b755-4a49-9a73-31783f8b85fe',
		},
	}
}
