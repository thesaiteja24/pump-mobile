import type { ExpoConfig } from 'expo/config'

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
	const env = process.env.APP_ENV ?? 'development'
	const isProd = env === 'production'

	return {
		name: isProd ? 'PUMP' : 'PUMP (Dev)',
		slug: 'pump',
		version: '0.1.0',
		orientation: 'portrait',
		icon: isProd ? './assets/images/icon.png' : './assets/images/icon.png',
		scheme: 'pump',
		userInterfaceStyle: 'dark',
		newArchEnabled: true,

		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.thesaiteja.pump',
			associatedDomains: ['applinks:pump.thesaiteja.dev'],
		},

		android: {
			package: 'com.thesaiteja.pump',
			versionCode: 1,
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#000000',
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
						extraProguardRules: `
						-keep class coil3.** { *; }
						-dontwarn coil3.**

						-dontwarn com.google.api.client.**
						-dontwarn org.joda.time.**
						-dontwarn com.google.crypto.tink.**

						-keep class io.grpc.** { *; }
						-dontwarn io.grpc.**

						-keep class io.opentelemetry.** { *; }
						-dontwarn io.opentelemetry.**
					`,
					},
				},
			],
			[
				'expo-splash-screen',
				{
					image: './assets/images/splash-icon-dark.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#000000',
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
			[
				'onesignal-expo-plugin',
				{
					mode: isProd ? 'production' : 'development',
				},
			],
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
