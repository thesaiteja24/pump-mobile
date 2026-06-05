import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { CustomText } from '@/components/ui/custom-text'
import { useGoogleSignIn } from '@/hooks/auth/use-google-sign-in'
import { useTheme } from '@/hooks/use-theme'

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  brand: {
    alignItems: 'center',
    gap: 12,
  },
  tagline: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
  loader: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  legal: {
    textAlign: 'center',
  },
})

// ─── Screen ───────────────────────────────────────────────────────────────────

/**
 * Login screen — entry point for unauthenticated users.
 *
 * Currently supports Google Sign-In only (browser-based OAuth2 via
 * @react-native-google-signin/google-signin). Additional providers (Apple, email) can be added here.
 */
export default function LoginScreen() {
  const { signIn, isLoading } = useGoogleSignIn()
  const { colorModes, spacing } = useTheme()

  return (
    <View style={[styles.root, { backgroundColor: colorModes.background.primary }]}>
      {/* Branding */}
      <View style={styles.brand}>
        <CustomText variant="displayXl" weight="bold" style={{ color: colorModes.text.primary, fontSize: 64, lineHeight: 72 }}>
          Pump
        </CustomText>
        <CustomText variant="body" color="muted" align="center" style={styles.tagline}>
          Your fitness journey starts here
        </CustomText>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { gap: spacing.md }]}>
        {isLoading
          ? (
              <View style={styles.loader}>
                <ActivityIndicator color={colorModes.foreground.accent} size="large" />
                <CustomText variant="bodySm" color="muted">
                  Signing you in…
                </CustomText>
              </View>
            )
          : (
              <Button
                variant="primary"
                size="lg"
                title="Continue with Google"
                onPress={signIn}
              />
            )}
      </View>

      <CustomText variant="caption" color="muted" align="center" style={styles.legal}>
        By continuing you agree to our Terms of Service and Privacy Policy
      </CustomText>
    </View>
  )
}
