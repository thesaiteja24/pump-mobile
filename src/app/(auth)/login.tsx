import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
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
  wordmark: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
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
  loaderLabel: {
    fontSize: 14,
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
  const { colors, spacing } = useTheme()

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Branding */}
      <View style={styles.brand}>
        <Text style={[styles.wordmark, { color: colors.text }]}>Pump</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          Your fitness journey starts here
        </Text>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { gap: spacing.md }]}>
        {isLoading
          ? (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={[styles.loaderLabel, { color: colors.textMuted }]}>
                  Signing you in…
                </Text>
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

      <Text style={[styles.legal, { color: colors.textMuted }]}>
        By continuing you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  )
}
