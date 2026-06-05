import { Stack } from 'expo-router'
import { HeaderHeightContext } from 'expo-router/react-navigation'
import React, { useContext } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { OfflineBanner } from '@/components/ui/offline-banner'
import { useTheme } from '@/hooks/use-theme'

import type { ThemeColorModes } from '@/hooks/use-theme'
import type { StyleProp, ViewStyle } from 'react-native'
import type { Edge } from 'react-native-safe-area-context'

export interface BaseScreenProps {
  children: React.ReactNode
  footer?: React.ReactNode
  title?: string
  headerLeft?: () => React.ReactNode
  headerRight?: () => React.ReactNode
  edges?: Edge[]
  style?: StyleProp<ViewStyle>
  footerStyle?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  scrollable?: boolean
  keyBoardAvoiding?: boolean
  hasTabBar?: boolean
}

function getFinalEdges(edges: Edge[] | undefined, hasHeader: boolean): Edge[] {
  if (edges)
    return edges
  return hasHeader ? ['left', 'right'] : ['top', 'left', 'right']
}

function getKeyboardBehavior(keyBoardAvoiding: boolean, scrollable: boolean) {
  if (!keyBoardAvoiding)
    return undefined

  if (Platform.OS !== 'ios')
    return 'height'

  return scrollable ? 'height' : 'padding'
}

/**
 * A layout wrapper component for screens.
 * Handles safe area insets, react-navigation header stack options, and standard paddings.
 */

interface HeaderConfigProps {
  title?: string
  hasHeader: boolean
  isDark: boolean
  colorModes: ThemeColorModes
  headerLeft?: () => React.ReactNode
  headerRight?: () => React.ReactNode
}

function HeaderConfig({
  title,
  hasHeader,
  isDark,
  colorModes,
  headerLeft,
  headerRight,
}: HeaderConfigProps) {
  return (
    <Stack.Screen
      options={{
        headerShown: hasHeader,
        title: title ?? '',
        headerLeft,
        headerRight,
        headerTransparent: true,
        headerBlurEffect: isDark ? 'dark' : 'light',
        headerShadowVisible: false,
        headerTintColor: colorModes.text.primary,
        headerTitleAlign: headerLeft ? 'center' : 'left',
        headerBackground: () =>
          Platform.OS === 'ios'
            ? undefined
            : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colorModes.surface.primary,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colorModes.border.primary,
                  }}
                />
              ),
      }}
    />
  )
}

interface ScreenContentProps {
  scrollable: boolean
  children: React.ReactNode
  headerHeight: number
  contentStyle: StyleProp<ViewStyle>
  hasFooter: boolean
  hasTabBar: boolean
}

function ScreenContent({
  scrollable,
  children,
  headerHeight,
  contentStyle,
  hasFooter,
  hasTabBar,
}: ScreenContentProps) {
  const { layout, spacing } = useTheme()
  return scrollable
    ? (
        <ScrollView
          style={layout.flex1}
          contentContainerStyle={[
            {
              padding: spacing.lg,
              gap: spacing.md,
              paddingBottom: hasFooter ? spacing.lg : (hasTabBar ? spacing.tabBar : spacing.lg),
            },
            Platform.OS !== 'ios' && { paddingTop: headerHeight },
            contentStyle,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={true}
          stickyHeaderIndices={[0]}
        >
          <OfflineBanner />
          {children}
        </ScrollView>
      )
    : (
        <View style={[layout.flex1, { paddingTop: headerHeight }]}>
          <OfflineBanner />
          <View style={[{ padding: spacing.lg, gap: spacing.md }, contentStyle]}>
            {children}
          </View>
        </View>
      )
}

function ScreenFooter({
  children,
  hasTabBar,
  style,
}: {
  children: React.ReactNode
  hasTabBar: boolean
  style: StyleProp<ViewStyle>
}) {
  const { colorModes, spacing } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        {
          borderTopWidth: 1,
          borderTopColor: colorModes.border.primary,
          backgroundColor: colorModes.surface.primary,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: hasTabBar ? spacing.lg : insets.bottom + spacing.lg,
          marginBottom: hasTabBar ? spacing.tabBar : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function BaseScreen({
  children,
  footer,
  title,
  headerLeft,
  headerRight,
  edges,
  style,
  footerStyle,
  contentStyle,
  scrollable = false,
  keyBoardAvoiding = true,
  hasTabBar = true,
}: BaseScreenProps) {
  const { isDark, colorModes } = useTheme()
  const hasHeader = !(!title && !headerLeft && !headerRight)
  const contextHeaderHeight = useContext(HeaderHeightContext)
  const headerHeight = contextHeaderHeight ?? 0

  const finalEdges = getFinalEdges(edges, hasHeader)

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colorModes.background.primary }, style]}
      edges={finalEdges}
    >
      <HeaderConfig
        title={title}
        hasHeader={hasHeader}
        isDark={isDark}
        colorModes={colorModes}
        headerLeft={headerLeft}
        headerRight={headerRight}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={getKeyboardBehavior(keyBoardAvoiding, scrollable)}
      >
        <ScreenContent
          scrollable={scrollable}
          headerHeight={headerHeight}
          contentStyle={contentStyle}
          hasFooter={!!footer}
          hasTabBar={hasTabBar}
        >
          {children}
        </ScreenContent>
        {footer && (
          <ScreenFooter hasTabBar={hasTabBar} style={footerStyle}>
            {footer}
          </ScreenFooter>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
