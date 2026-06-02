import { SegmentedControl as ExpoSegmentedControl } from '@expo/ui/community/segmented-control'
import * as Haptics from 'expo-haptics'
import { Platform, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

import type { NativeSegmentedControlChangeEvent, SegmentedControlProps } from '@expo/ui/community/segmented-control'

export type { NativeSegmentedControlChangeEvent, SegmentedControlProps }

function CustomSegmentedControl(props: SegmentedControlProps) {
  const { onChange, onValueChange, ...rest } = props
  const { colors } = useTheme()

  const handleValueChange = (value: string, index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }

    onValueChange?.(value)

    if (onChange) {
      const event: NativeSegmentedControlChangeEvent = {
        nativeEvent: { value, selectedSegmentIndex: index },
      } as NativeSegmentedControlChangeEvent
      onChange(event)
    }
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.input,
          borderRadius: 999,
          padding: 2,
        },
        rest.style,
      ]}
    >
      {props.values?.map((value, index) => {
        const isActive = props.selectedIndex === index
        return (
          <TouchableOpacity
            key={value}
            activeOpacity={0.8}
            onPress={() => handleValueChange(value, index)}
            style={[
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 6,
                borderRadius: 999,
              },
              isActive && {
                backgroundColor: colors.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
          >
            <Text
              style={[
                {
                  fontSize: 13,
                  fontWeight: isActive ? '600' : '500',
                  color: colors.text,
                },
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

/**
 * Universal segmented control component using `@expo/ui/community/segmented-control` on iOS,
 * and a custom token-driven UI on Android/Web to perfectly mimic the pill shape.
 * Automatically triggers light impact haptic feedback upon user selection changes.
 */
export function SegmentedControl(props: SegmentedControlProps) {
  const { isDark } = useTheme()
  // iOS uses the default native segment control
  if (Platform.OS === 'ios') {
    return (
      <ExpoSegmentedControl
        {...props}
        appearance={isDark ? 'dark' : 'light'}
        onChange={(event) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          props.onChange?.(event)
        }}
      />
    )
  }

  // Android & Web use a custom design token implementation
  return <CustomSegmentedControl {...props} />
}
