import { KeyboardAvoidingView, Platform } from 'react-native'

import BaseScreen, { BaseScreenProps } from './BaseScreen'

/**
 * BaseFormScreen component that provides a standardized layout for screens containing forms.
 * It automatically handles keyboard avoidance using KeyboardAvoidingView and inherits all
 * features from BaseScreen (headers, safe areas, scrolling).
 *
 * @component
 * @example
 * // Simple login form screen
 * <BaseFormScreen title="Login">
 *   <TextInput placeholder="Email" />
 *   <TextInput placeholder="Password" secureTextEntry />
 *   <Button title="Submit" />
 * </BaseFormScreen>
 *
 * @example
 * // Form screen with a custom header and adjusted keyboard offset
 * <BaseFormScreen
 *   title="Edit Profile"
 *   backButton
 *   keyboardVerticalOffset={120}
 *   scroll={true}
 * >
 *   <ProfileForm />
 * </BaseFormScreen>
 */
export interface BaseFormScreenProps extends BaseScreenProps {
  /**
   * Overrides the default keyboard vertical offset.
   * This is useful if the header or top content has a custom height.
   * Defaults to 100 on iOS.
   */
  keyboardVerticalOffset?: number
}

/**
 * @param {BaseFormScreenProps} props - The props for the BaseFormScreen component.
 */
const BaseFormScreen = ({
  children,
  keyboardVerticalOffset = 100,
  ...baseScreenProps
}: BaseFormScreenProps) => {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
    >
      <BaseScreen {...baseScreenProps} scroll={baseScreenProps.scroll ?? true}>
        {children}
      </BaseScreen>
    </KeyboardAvoidingView>
  )
}

export default BaseFormScreen
