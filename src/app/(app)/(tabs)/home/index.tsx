import { Text } from 'react-native'

import { BaseScreen } from '@/components/ui/base-screen'
import { useTheme } from '@/hooks/use-theme'
import { useAuthStore } from '@/stores/auth-store'

export default function HomeScreen() {
  const { user } = useAuthStore()
  const { typography, colors } = useTheme()

  return (
    <BaseScreen scrollable>

      <Text style={[typography.displayXl, { color: colors.text }]}>
        Welcome
        {user?.firstName ? `, ${user.firstName}` : ''}
        !
      </Text>

    </BaseScreen>
  )
}
