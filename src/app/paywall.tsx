import { useRouter } from 'expo-router'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { UserPaywall } from '@/components/user/UserPaywall'

export default function UserPaywallScreen() {
  const router = useRouter()

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-zinc-950">
      <UserPaywall
        onSuccess={() => {
          if (router.canGoBack()) {
            router.back()
          } else {
            router.replace('/')
          }
        }}
        onCancel={() => {
          if (router.canGoBack()) {
            router.back()
          } else {
            router.replace('/')
          }
        }}
      />
    </SafeAreaView>
  )
}
