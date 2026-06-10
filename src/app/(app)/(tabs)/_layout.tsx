import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { Platform } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

export default function TabLayout() {
  const { isDark, colorModes } = useTheme()
  const iconColor = Platform.OS === 'ios'
    ? {
        default: colorModes.text.secondary,
        selected: colorModes.text.primary,
      }
    : {
        default: colorModes.text.secondary,
        selected: colorModes.surface.primary,
      }

  return (
    <NativeTabs
      backgroundColor={
        Platform.OS === 'ios'
          ? 'transparent'
          : colorModes.surface.primary
      }
      rippleColor="transparent"
      indicatorColor={colorModes.text.primary}
      iconColor={iconColor}
      labelStyle={{
        default: {
          color: colorModes.text.secondary,
        },
        selected: {
          color: colorModes.text.primary,
        },
      }}
      disableTransparentOnScrollEdge={true}
      blurEffect={Platform.OS === 'ios' ? 'none' : (isDark ? 'dark' : 'light')}
      shadowColor={Platform.OS === 'ios' ? 'transparent' : colorModes.border.primary}
      // Minimize behavior: collapses full tab bar into a single floating pill on scroll
      minimizeBehavior="onScrollDown"
      // Enable floating bar / sidebar transitions on iPadOS and macOS
      sidebarAdaptable={Platform.OS === 'ios'}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="habits">
        <NativeTabs.Trigger.Label>Habits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checkmark.circle.fill" md="check_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analytics">
        <NativeTabs.Trigger.Label>Analytics</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" md="bar_chart_4_bars" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
