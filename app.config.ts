import type { ExpoConfig } from 'expo/config'

function resolveAppEnv(): string {
  if (process.env.APP_ENV) {
    return process.env.APP_ENV
  }

  if (process.env.EAS_BUILD_PROFILE === 'production') {
    return 'production'
  }

  if (process.env.EAS_BUILD_PROFILE === 'preview') {
    return 'preview'
  }

  return 'development'
}

const appEnv = resolveAppEnv()
const isProd = appEnv === 'production'
const easProjectId = '46384027-b755-4a49-9a73-31783f8b85fe'
const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? 'pump'
const webHost = process.env.EXPO_PUBLIC_WEB_HOST

function getGoogleScheme(clientId?: string): string | null {
  if (!clientId?.endsWith('.apps.googleusercontent.com')) {
    return null
  }

  return `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`
}

const plugins: ExpoConfig['plugins'] = [
  'expo-router',
  'expo-font',
  'expo-secure-store',
  'expo-audio',
  'expo-web-browser',
  'expo-image',
  'expo-asset',
  [
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme: getGoogleScheme(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) || 'com.googleusercontent.apps.dummy',
    },
  ],
  [
    'expo-splash-screen',
    {
      image: './src/assets/android-icon-foreground.png',
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
  ],
  [
    'expo-build-properties',
    {
      android: {
        enableMinifyInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
        enablePrecompiledHeaders: true,
      },
      ios: {
        deploymentTarget: '16.4',
      },
    },
  ],
]

if (process.env.EXPO_PUBLIC_SENTRY_ORG && process.env.EXPO_PUBLIC_SENTRY_PROJECT) {
  plugins.push([
    '@sentry/react-native',
    {
      organization: process.env.EXPO_PUBLIC_SENTRY_ORG,
      project: process.env.EXPO_PUBLIC_SENTRY_PROJECT,
    },
  ])
}

if (process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID) {
  plugins.push([
    'onesignal-expo-plugin',
    { mode: isProd ? 'production' : 'development' },
  ])
}

const iosConfig = {
  supportsTablet: true,
  bundleIdentifier: 'com.thesaiteja.pump',
  config: {
    usesNonExemptEncryption: false,
  },
  icon: {
    dark: './src/assets/icon.png',
    light: './src/assets/icon.png',
  },
  ...(webHost ? { associatedDomains: [`applinks:${webHost}`] } : { associatedDomains: ['applinks:pump.thesaiteja.dev'] }),
}

const androidConfig = {
  package: 'com.thesaiteja.pump',
  versionCode: 1,
  adaptiveIcon: {
    foregroundImage: './src/assets/android-icon-foreground.png',
    backgroundImage: './src/assets/android-icon-background.png',
    backgroundColor: '#000000',
  },

  permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS'],
  softwareKeyboardLayoutMode: 'resize' as const,
  intentFilters: [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'https',
          host: webHost ?? 'pump.thesaiteja.dev',
          pathPrefix: '/share',
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ],
}

const webConfig = {
  output: 'static' as const,
  favicon: './src/assets/icon.png',
  bundler: 'metro' as const,
}

export default function getExpoConfig({ config }: { config: ExpoConfig }): ExpoConfig {
  return {
    ...config,
    name: 'PUMP',
    slug: 'pump',
    version: '1.0.0-alpha.1',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    scheme: [
      appScheme,
    ],

    userInterfaceStyle: 'automatic',

    ios: iosConfig,
    android: androidConfig,
    web: webConfig,

    owner: 'thesaiteja',

    ...(easProjectId
      ? {
          updates: {
            checkAutomatically: 'NEVER' as const,
            fallbackToCacheTimeout: 0,
            url: `https://u.expo.dev/${easProjectId}`,
          },
        }
      : {}),

    runtimeVersion: {
      policy: 'appVersion',
    },

    plugins,

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
      onDemandFilesystem: true,
    },

    extra: {
      APP_ENV: appEnv,
      isProd,
      router: {},
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
  }
}
