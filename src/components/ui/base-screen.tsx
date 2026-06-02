import { Stack } from 'expo-router'
import { HeaderHeightContext } from 'expo-router/react-navigation'
import React, { useContext } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { OfflineBanner } from '@/components/ui/offline-banner'
import { useTheme } from '@/hooks/use-theme'

import type { ThemeColors } from '@/hooks/use-theme'
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
}

function getFinalEdges(edges: Edge[] | undefined, hasHeader: boolean): Edge[] {
  if (edges)
    return edges
  return hasHeader ? ['left', 'right'] : ['top', 'left', 'right']
}

/**
 * A layout wrapper component for screens.
 * Handles safe area insets, react-navigation header stack options, and standard paddings.
 */

interface HeaderConfigProps {
  title?: string
  hasHeader: boolean
  isDark: boolean
  colors: ThemeColors
  headerLeft?: () => React.ReactNode
  headerRight?: () => React.ReactNode
}

function HeaderConfig({
  title,
  hasHeader,
  isDark,
  colors,
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
        headerTintColor: colors.text,
        headerTitleAlign: headerLeft ? 'center' : 'left',
        headerBackground: () =>
          Platform.OS === 'ios'
            ? undefined
            : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
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
}

function ScreenContent({
  scrollable,
  children,
  headerHeight,
  contentStyle,
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
              paddingBottom: spacing.tabBar,
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
}: BaseScreenProps) {
  const { isDark, colors } = useTheme()
  const hasHeader = !(!title && !headerLeft && !headerRight)
  const contextHeaderHeight = useContext(HeaderHeightContext)
  const headerHeight = contextHeaderHeight ?? 0

  const finalEdges = getFinalEdges(edges, hasHeader)

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      edges={finalEdges}
    >
      <HeaderConfig
        title={title}
        hasHeader={hasHeader}
        isDark={isDark}
        colors={colors}
        headerLeft={headerLeft}
        headerRight={headerRight}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyBoardAvoiding
          ? (Platform.OS === 'ios' ? (scrollable ? 'height' : 'padding') : 'height')
          : undefined}
      >
        <ScreenContent
          scrollable={scrollable}
          headerHeight={headerHeight}
          contentStyle={contentStyle}
        >
          {children}
        </ScreenContent>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
