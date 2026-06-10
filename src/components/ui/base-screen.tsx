import { Stack, useNavigation } from 'expo-router'
import { HeaderHeightContext } from 'expo-router/react-navigation'
import React, { useContext } from 'react'
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { OfflineBanner } from '@/components/ui/offline-banner'
import { useTheme } from '@/hooks/use-theme'

import type { StyleProp, ViewStyle } from 'react-native'
import type { Edge } from 'react-native-safe-area-context'

export interface BaseScreenProps {
  children: React.ReactNode
  title?: string
  headerLeft?: () => React.ReactNode
  headerRight?: () => React.ReactNode
  edges?: Edge[]
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  scrollable?: boolean
  keyBoardAvoiding?: boolean
  footer?: React.ReactNode
  hasTabBar?: boolean
  onRefresh?: () => void
  refreshing?: boolean
}

function getKeyboardBehavior(keyBoardAvoiding: boolean) {
  if (!keyBoardAvoiding)
    return undefined
  return Platform.OS === 'ios' ? 'padding' : 'height'
}

function getFinalEdges(edges: Edge[] | undefined, hasHeader: boolean): Edge[] {
  if (edges)
    return edges
  return hasHeader ? ['left', 'right'] : ['top', 'left', 'right']
}

function useAutoTabBar(hasTabBarProp?: boolean): boolean {
  const navigation = useNavigation()
  if (hasTabBarProp !== undefined)
    return hasTabBarProp

  try {
    const parent = navigation.getParent()
    return parent?.getState()?.type === 'tab'
  }
  catch {
    return false
  }
}

/**
 * A layout wrapper component for screens.
 * Handles safe area insets, react-navigation header stack options, and standard paddings.
 */

interface HeaderConfigProps {
  title?: string
  hasHeader: boolean
  headerLeft?: () => React.ReactNode
  headerRight?: () => React.ReactNode
}

function HeaderConfig({
  title,
  hasHeader,
  headerLeft,
  headerRight,
}: HeaderConfigProps) {
  const { isDark, colorModes } = useTheme()

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

interface ScrollableContentProps {
  children: React.ReactNode
  headerHeight: number
  bottomInset: number
  contentStyle: StyleProp<ViewStyle>
  footer: React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}

function ScrollableContent({
  children,
  headerHeight,
  bottomInset,
  contentStyle,
  footer,
  onRefresh,
  refreshing = false,
}: ScrollableContentProps) {
  const { layout, spacing, colorModes } = useTheme()

  const refreshControl = onRefresh
    ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colorModes.text.primary}
          colors={[colorModes.text.primary]}
          progressBackgroundColor={colorModes.surface.primary}
        />
      )
    : undefined

  return (
    <View style={[{ flexGrow: 1 }, { paddingTop: headerHeight }]}>
      <OfflineBanner />
      <ScrollView
        style={layout.flex1}
        contentContainerStyle={[
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: footer ? 100 : bottomInset,
            gap: spacing.lg,
            flexGrow: 1,
          },
          contentStyle,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </View>
  )
}

interface StaticContentProps {
  children: React.ReactNode
  headerHeight: number
  bottomInset: number
  contentStyle: StyleProp<ViewStyle>
  footer: React.ReactNode
}

function StaticContent({
  children,
  headerHeight,
  bottomInset,
  contentStyle,
  footer,
}: StaticContentProps) {
  const { layout, spacing } = useTheme()

  return (
    <View style={[layout.flex1, { paddingTop: headerHeight }]}>
      <OfflineBanner />
      <View
        style={[
          {
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: footer ? spacing.lg : bottomInset,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  )
}

interface ScreenFooterProps {
  footer: React.ReactNode
  hasTabBar: boolean
  insetsBottom: number
}

function ScreenFooter({ footer, hasTabBar, insetsBottom }: ScreenFooterProps) {
  const { colorModes, spacing } = useTheme()
  if (!footer)
    return null

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colorModes.border.primary,
        backgroundColor: colorModes.surface.primary,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: hasTabBar ? spacing.lg : insetsBottom + spacing.lg,
        marginBottom: hasTabBar ? spacing.tabBar : 0,
      }}
    >
      {footer}
    </View>
  )
}

export function BaseScreen({
  children,
  title,
  headerLeft,
  headerRight,
  edges,
  style,
  contentStyle,
  scrollable = false,
  keyBoardAvoiding = true,
  footer,
  hasTabBar: hasTabBarProp,
  onRefresh,
  refreshing,
}: BaseScreenProps) {
  const { colorModes, spacing } = useTheme()
  const insets = useSafeAreaInsets()
  const hasHeader = !(!title && !headerLeft && !headerRight)
  const contextHeaderHeight = useContext(HeaderHeightContext)
  const headerHeight = contextHeaderHeight ?? 0

  const hasTabBar = useAutoTabBar(hasTabBarProp)
  const finalEdges = getFinalEdges(edges, hasHeader)
  const bottomInset = hasTabBar ? spacing.tabBar : insets.bottom + spacing.lg

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colorModes.background.primary }, style]}
      edges={finalEdges}
    >
      <HeaderConfig
        title={title}
        hasHeader={hasHeader}
        headerLeft={headerLeft}
        headerRight={headerRight}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={getKeyboardBehavior(keyBoardAvoiding)}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        {scrollable
          ? (
              <ScrollableContent
                headerHeight={headerHeight}
                bottomInset={bottomInset}
                contentStyle={contentStyle}
                footer={footer}
                onRefresh={onRefresh}
                refreshing={refreshing}
              >
                {children}
              </ScrollableContent>
            )
          : (
              <StaticContent
                headerHeight={headerHeight}
                bottomInset={bottomInset}
                contentStyle={contentStyle}
                footer={footer}
              >
                {children}
              </StaticContent>
            )}
      </KeyboardAvoidingView>
      <ScreenFooter footer={footer} hasTabBar={hasTabBar} insetsBottom={insets.bottom} />
    </SafeAreaView>
  )
}
