import { FlashList, FlashListProps } from '@shopify/flash-list'
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native'

import { useThemeColor } from '@/hooks/theme'

import { BaseEmptyState } from './BaseEmptyState'
import BaseScreen, { BaseScreenProps } from './BaseScreen'

/**
 * BaseListScreen component that provides a standardized layout for screens centered around a list of items.
 * It leverages Shopify's FlashList for high-performance rendering and includes built-in support for
 * pagination, pull-to-refresh, empty states, and standard screen headers.
 *
 * @component
 * @example
 * // Simple list with a title
 * <BaseListScreen
 *   title="My Workouts"
 *   data={workouts}
 *   renderItem={({ item }) => <WorkoutCard workout={item} />}
 *   keyExtractor={(item) => item.id}
 * />
 *
 * @example
 * // Advanced list with pagination and custom header content
 * <BaseListScreen
 *   title="Discover"
 *   data={discoverWorkouts}
 *   renderItem={({ item }) => <SocialCard workout={item} />}
 *   isLoading={loading}
 *   hasNextPage={true}
 *   onEndReached={fetchNextPage}
 *   isFetchingNextPage={isFetching}
 *   emptyText="No workouts found"
 * >
 *   <FilterBar />
 * </BaseListScreen>
 */
export interface BaseListScreenProps<T> extends Omit<
  BaseScreenProps,
  'scroll' | 'refreshControl'
> {
  /** The array of data to render in the list. */
  data: readonly T[] | null | undefined
  /** Render function for list items, identical to FlashList's renderItem. */
  renderItem: FlashListProps<T>['renderItem']
  /** Key extractor function for the list items. */
  keyExtractor?: FlashListProps<T>['keyExtractor']
  /** Estimated item size for FlashList performance optimization. Defaults to 100. */
  estimatedItemSize?: number
  /** Callback function triggered when the user pulls down to refresh the list. */
  onRefresh?: () => void | Promise<void>
  /** Whether the list is currently refreshing. */
  isRefreshing?: boolean
  /** Callback function triggered when the list reaches the end of the data. Use for infinite scrolling. */
  onEndReached?: () => void
  /** Whether a next page is currently being fetched. */
  isFetchingNextPage?: boolean
  /** Whether there are more pages to load. */
  hasNextPage?: boolean
  /** Text to display when the data array is empty. Defaults to 'No items found.'. */
  emptyText?: string
  /** Text to display at the bottom of the list when all items are loaded. Defaults to "You've reached the end.". */
  endReachedText?: string
  /** The number of columns to render in the list. */
  numColumns?: number
  /** Additional props to pass directly to the underlying FlashList component. */
  flashListProps?: Partial<FlashListProps<T>>
  /** Optional static content to render above the list. */
  children?: React.ReactNode
}

/**
 * @param {BaseListScreenProps<T>} props - The props for the BaseListScreen component.
 */
export function BaseListScreen<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize = 100,
  onRefresh,
  isRefreshing = false,
  onEndReached,
  isFetchingNextPage = false,
  hasNextPage = false,
  emptyText = 'No items found.',
  endReachedText = "You've reached the end.",
  numColumns,
  flashListProps,
  children,
  ...baseScreenProps
}: BaseListScreenProps<T>) {
  const colors = useThemeColor()

  const renderFooter = () => {
    if (!data?.length) return null

    if (hasNextPage) {
      return (
        <View className="mb-[100%] items-center justify-center p-4 pb-12 pt-6">
          {isFetchingNextPage && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      )
    }

    return (
      <View className="mb-[100%] items-center justify-center p-4 pb-12 pt-6">
        <Text className="text-neutral-500 dark:text-neutral-400">{endReachedText}</Text>
      </View>
    )
  }

  const renderEmpty = () => {
    if (baseScreenProps.isLoading) return null
    return <BaseEmptyState message={emptyText} dashed={false} />
  }

  return (
    <BaseScreen {...baseScreenProps} isLoading={false} scroll={false}>
      {children}
      {baseScreenProps.isLoading ? (
        <View className={baseScreenProps.padded ? 'flex-1 px-4' : 'flex-1'}>
          {baseScreenProps.shimmer ? (
            baseScreenProps.shimmer
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      ) : (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          numColumns={numColumns}
          onEndReached={() => {
            if (!isFetchingNextPage && hasNextPage && onEndReached) {
              onEndReached()
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter()}
          ListEmptyComponent={renderEmpty()}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          contentContainerStyle={
            baseScreenProps.padded ? { paddingHorizontal: 16, paddingBottom: 16 } : undefined
          }
          {...flashListProps}
        />
      )}
    </BaseScreen>
  )
}

