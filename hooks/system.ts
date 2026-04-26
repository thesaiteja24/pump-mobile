import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import VersionCheck from 'react-native-version-check'

export function useStoreUpdate() {
  const [showModal, setShowModal] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | undefined>()

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Only check on Android for now as per user request (Play Store)
        if (Platform.OS !== 'android') return

        // 1. Try common library check
        let res = null
        try {
          // Silence internal library logs that cause "Parse Error" clutter in terminal
          const originalWarn = console.warn
          console.warn = () => {}
          res = await VersionCheck.needUpdate().finally(() => {
            console.warn = originalWarn
          })
        } catch (e) {
          // Library failed, manual check below
        }

        if (res && res.isNeeded) {
          setLatestVersion(res.latestVersion)
          setShowModal(true)
          return
        }

        // 2. Manual Fallback for "Parse Error"
        // Sometimes the library scraper fails, we attempt a regex search on the Play Store page
        const packageName = Constants.expoConfig?.android?.package || 'com.thesaiteja.pump'
        const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=US`

        const response = await fetch(url)
        const text = await response.text()

        // Modern Play Store often hides version in a JSON blob like [[["1.2.3"]]]
        // This regex looks for common version number patterns in the minified JS/JSON
        const versionMatch = text.match(/\[\[\["([0-9]+\.[0-9]+\.[0-9]+)"\]\]/)
        const currentVersion = Constants.expoConfig?.version || '0.0.0'

        if (versionMatch && versionMatch[1]) {
          const storeVersion = versionMatch[1]
          if (storeVersion !== currentVersion) {
            setLatestVersion(storeVersion)
            // Basic semver comparison (just check for inequality for now)
            setShowModal(true)
          }
        }
      } catch (e: any) {
        // Silent fail
      }
    }

    checkVersion()
  }, [])

  const handleUpdate = async () => {
    try {
      const url = await VersionCheck.getStoreUrl()
      if (url) {
        Linking.openURL(url)
      } else {
        // Fallback to manual package name
        const packageName = Constants.expoConfig?.android?.package || 'com.thesaiteja.pump'
        Linking.openURL(`market://details?id=${packageName}`)
      }
    } catch (e) {
      console.error('Failed to open store url:', e)
    }
  }

  const handleLater = () => {
    setShowModal(false)
  }

  return {
    showModal,
    latestVersion,
    handleUpdate,
    handleLater,
  }
}
