declare module 'react-native-version-check' {
  export interface NeedUpdateResponse {
    isNeeded: boolean
    latestVersion: string
    contentUri: string
    storeUrl: string
  }

  export default class VersionCheck {
    static needUpdate(params?: {
      currentVersion?: string
      latestVersion?: string
      packageName?: string
      bundleId?: string
      ignoreDev?: boolean
    }): Promise<NeedUpdateResponse>
    static getStoreUrl(params?: {
      appID?: string
      packageName?: string
      appName?: string
      ignoreDev?: boolean
    }): Promise<string>
    static getCurrentVersion(): string
    static getCurrentBuildNumber(): string
    static getLatestVersion(params?: {
      provider?: 'playStore' | 'appStore'
      packageName?: string
      appID?: string
      ignoreDev?: boolean
    }): Promise<string>
  }
}
