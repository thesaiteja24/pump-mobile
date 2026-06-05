import { Text } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

import type { ThemeColorModes, ThemeTypography } from '@/hooks/use-theme'
import type { TextProps, TextStyle } from 'react-native'

export type TextVariant = Exclude<keyof ThemeTypography, 'fontFamily' | 'fontSize' | 'lineHeight'>
export type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'danger' | 'warning' | 'success' | 'info'
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold'

export interface CustomTextProps extends TextProps {
  variant?: TextVariant
  color?: TextColor
  weight?: TextWeight
  align?: TextStyle['textAlign']
}

function resolveColor(color: TextColor, colorModes: ThemeColorModes) {
  switch (color) {
    case 'secondary':
      return colorModes.text.secondary
    case 'muted':
      return colorModes.text.muted
    case 'inverse':
      return colorModes.text.inverse
    case 'accent':
      return colorModes.text.accent
    case 'danger':
      return colorModes.text.danger
    case 'warning':
      return colorModes.text.warning
    case 'success':
      return colorModes.text.success
    case 'info':
      return colorModes.text.info
    case 'primary':
    default:
      return colorModes.text.primary
  }
}

function resolveFontFamily(weight: TextWeight, typography: ThemeTypography) {
  switch (weight) {
    case 'medium':
      return typography.fontFamily.interMedium
    case 'semibold':
      return typography.fontFamily.interSemiBold
    case 'bold':
      return typography.fontFamily.interBold
    case 'regular':
    default:
      return typography.fontFamily.inter
  }
}

export function CustomText({
  variant = 'body',
  color = 'primary',
  weight,
  align,
  style,
  children,
  ...props
}: CustomTextProps) {
  const { colorModes, typography } = useTheme()

  const textStyle: TextStyle = {
    ...typography[variant],
    color: resolveColor(color, colorModes),
    ...(weight ? { fontFamily: resolveFontFamily(weight, typography) } : {}),
    ...(align ? { textAlign: align } : {}),
  }

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  )
}
