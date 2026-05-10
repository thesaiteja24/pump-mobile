import * as FileSystem from 'expo-file-system/legacy'
import { useCallback } from 'react'
import { Platform, Share } from 'react-native'

import { SHARE_BASE_URL } from '@/constants/urls'
import { Arise } from '@/lib/arise'

export type ShareType = 'workout' | 'template' | 'profile'

interface ShareOptions {
  title?: string
  message?: string
  image?: string | null
}

/**
 * A hook that provides a unified sharing interface for workouts, templates, and profiles.
 * It handles URL generation and optionally attaches the owner's profile picture.
 */
export function useShare() {
  const shareEntity = useCallback(async (type: ShareType, id: string, options: ShareOptions = {}) => {
    try {
      const shareUrl = `${SHARE_BASE_URL}/${type}/${id}`
      const message = options.message || `Check out this ${type} on Pump!`
      const title = options.title || 'Pump'

      const shareContent: any = {
        message: `${message} ${shareUrl}`,
        title,
      }

      // On iOS, we can share both text and a URL/File separately
      if (Platform.OS === 'ios') {
        shareContent.url = shareUrl
      }

      // If an image URL is provided, try to download it to local cache to help with rich previews/attachments
      if (options.image) {
        try {
          const filename = options.image.split('/').pop() || 'profile.jpg'
          const fileUri = `${FileSystem.cacheDirectory}${filename}`

          // Check if already exists to avoid redundant downloads
          const info = await FileSystem.getInfoAsync(fileUri)
          let finalUri = fileUri

          if (!info.exists) {
            const download = await FileSystem.downloadAsync(options.image, fileUri)
            if (download.status === 200) {
              finalUri = download.uri
            }
          }

          // On iOS, replacing the URL with the local file URI often results in a better preview
          // containing the image attachment in the share sheet.
          if (Platform.OS === 'ios' && finalUri) {
            shareContent.url = finalUri
          }
        } catch (imgError) {
          console.warn('Failed to prepare share image, falling back to link only:', imgError)
        }
      }

      const result = await Share.share(shareContent, {
        dialogTitle: title, // Android only
        subject: title, // iOS only
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      console.error('Error sharing:', error)
      Arise.error({
        heading: 'Sharing failed',
        content: 'Something went wrong while opening the share dialog.',
      })
    }
  }, [])

  return { shareEntity }
}
