import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { memo, useMemo } from 'react'
import {
  ActivityIndicator,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useThemeColor } from '@/hooks/theme'

import { Button } from './buttons'

/**
 * BaseScreen component that provides a consistent layout for all screens in the application.
 * It includes a standardized header, safe area handling, and optional scrolling/loading states.
 *
 * @component
 * @example
 * // Basic usage with a title and scrollable content
 * <BaseScreen title="Profile" scroll>
 *   <Text>Profile Content</Text>
 * </BaseScreen>
 *
 * @example
 * // Screen with back button, right action, and loading shimmer
 * <BaseScreen
 *   title="Workout Details"
 *   backButton
 *   right={<IconButton icon="share" onPress={handleShare} />}
 *   isLoading={loading}
 *   shimmer={<WorkoutDetailsShimmer />}
 * >
 *   <WorkoutContent />
 * </BaseScreen>
 */
export interface BaseScreenProps {
  /** The content to be rendered within the screen. */
  children?: React.ReactNode
  /** Optional component to be rendered at the bottom of the screen, outside the scroll area. */
  footerComponent?: React.ReactNode

  /** The primary title displayed in the header. */
  title?: string
  /** An optional subtitle displayed below the main title. */
  subTitle?: string

  /** Optional custom component to render on the left side of the header. Overrides the back button. */
  left?: React.ReactNode
  /** Whether to show a default back button in the header. */
  backButton?: boolean
  /** Callback function triggered when the back button is pressed. Defaults to router.back(). */
  onBackPress?: () => void

  /** Optional custom component to render on the right side of the header (e.g., action buttons). */
  right?: React.ReactNode

  /** Whether the main content area should be scrollable. Defaults to false. */
  scroll?: boolean

  /** Whether to apply standard horizontal padding to the screen content. Defaults to true. */
  padded?: boolean

  /** Optional RefreshControl component for pull-to-refresh functionality. Requires scroll={true}. */
  refreshControl?: React.ReactElement<RefreshControlProps>
  /** Custom styles for the scroll view's content container. */
  contentContainerStyle?: StyleProp<ViewStyle>

  /** Whether the screen is in a loading state. */
  isLoading?: boolean
  /** The shimmer/skeleton component to display while isLoading is true. */
  shimmer?: React.ReactNode
}

/**
 * Standardized Header sub-component for BaseScreen.
 * Handles the layout of title, subtitle, and action components.
 */
export const Header = memo(
  ({
    title,
    subTitle,
    left,
    right,
  }: Pick<BaseScreenProps, 'title' | 'subTitle' | 'left' | 'right'>) => {
    const hasCenteredHeader = Boolean(left && title)

    if (hasCenteredHeader) {
      return (
        <View className="relative flex-row items-center justify-between pb-4">
          <View className="flex-1 items-start">{left}</View>

          <Text
            numberOfLines={1}
            className="text-xl font-semibold tracking-widest text-black dark:text-white"
          >
            {title}
          </Text>

          <View className="flex-1 items-end">{right}</View>
        </View>
      )
    }

    return (
      <View className="flex-row items-start justify-between pb-4">
        <View className="flex-1 items-start">
          {title ? (
            <View>
              <Text className="text-2xl font-semibold tracking-widest text-black dark:text-white">
                {title}
              </Text>

              {subTitle && (
                <Text className="mt-1 text-base text-neutral-600 dark:text-neutral-400">
                  {subTitle}
                </Text>
              )}
            </View>
          ) : (
            left
          )}
        </View>

        {right && <View className="items-end">{right}</View>}
      </View>
    )
  },
)

Header.displayName = 'Header'

/**
 * @param {BaseScreenProps} props - The props for the BaseScreen component.
 */
const BaseScreen = ({
  children,
  footerComponent,
  title,
  subTitle,
  left,
  backButton,
  onBackPress,
  right,
  scroll = false,
  padded = true,
  refreshControl,
  contentContainerStyle,
  isLoading = false,
  shimmer,
}: BaseScreenProps) => {
  const router = useRouter()
  const theme = useThemeColor()

  const handleBackPress = React.useCallback(() => {
    if (onBackPress) {
      onBackPress()
    } else {
      router.back()
    }
  }, [onBackPress, router])

  const renderedLeft = useMemo(() => {
    if (left) return left
    if (backButton) {
      return (
        <Button
          title=""
          variant="ghost"
          leftIcon={
            <MaterialCommunityIcons
              name="chevron-double-left"
              size={32}
              color={theme.isDark ? 'white' : 'black'}
            />
          }
          onPress={handleBackPress}
          className="p-0"
        />
      )
    }
    return null
  }, [left, backButton, theme.isDark, handleBackPress])

  return (
    <SafeAreaView
      className={`flex-1 bg-white dark:bg-black ${padded && !scroll ? 'px-4 pt-4' : ''}`}
    >
      {title || subTitle || left || right ? (
        <View className={padded && scroll ? 'px-4 pt-4' : ''}>
          <Header title={title} subTitle={subTitle} left={renderedLeft} right={right} />
        </View>
      ) : null}

      {isLoading ? (
        <View className={padded && scroll ? 'flex-1 px-4' : 'flex-1'}>
          {shimmer ? (
            shimmer
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        </View>
      ) : scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            padded
              ? {
                  paddingHorizontal: 16,
                  paddingTop: title || subTitle || left || right ? 0 : 16,
                  paddingBottom: 16,
                }
              : undefined,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {!isLoading && footerComponent && footerComponent}
    </SafeAreaView>
  )
}

export default BaseScreen
