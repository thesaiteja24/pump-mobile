import { BaseScreen } from '@/components/ui/base-screen'
import { CustomText } from '@/components/ui/custom-text'
import { useAuthStore } from '@/stores/auth-store'

export default function HomeScreen() {
  const { user } = useAuthStore()

  return (
    <BaseScreen scrollable>
      <CustomText variant="displayXl">
        Welcome
        {user?.firstName ? `, ${user.firstName}` : ''}
        !
      </CustomText>
    </BaseScreen>
  )
}
