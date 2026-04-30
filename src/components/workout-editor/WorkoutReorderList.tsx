import type { ExerciseGroupType } from '@/types/workouts'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Text, View, useColorScheme } from 'react-native'
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const ROW_HEIGHT = 78
const EDGE_SCROLL_THRESHOLD = 96
const EDGE_SCROLL_SPEED = 14
const ROW_SPRING_CONFIG = {
  damping: 24,
  stiffness: 260,
}

type ReorderItem = {
  id: string
  title: string
  thumbnailUrl?: string
  instanceLabel?: string | null
  groupLabel?: string | null
  groupType?: ExerciseGroupType | null
  groupColor?: string | null
}

type Props = {
  items: ReorderItem[]
  onReorder: (orderedIds: string[]) => void
}

function buildPositions(items: ReorderItem[]) {
  return Object.fromEntries(items.map((item, index) => [item.id, index]))
}

function clamp(value: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(value, min), max)
}

function movePosition(
  positions: Record<string, number>,
  targetId: string,
  nextIndex: number,
): Record<string, number> {
  'worklet'

  const currentIndex = positions[targetId]
  if (currentIndex === nextIndex) {
    return positions
  }

  const nextPositions = { ...positions }

  Object.keys(nextPositions).forEach((id) => {
    if (id === targetId) {
      nextPositions[id] = nextIndex
      return
    }

    const index = nextPositions[id]
    if (currentIndex < nextIndex) {
      if (index > currentIndex && index <= nextIndex) {
        nextPositions[id] = index - 1
      }
      return
    }

    if (index >= nextIndex && index < currentIndex) {
      nextPositions[id] = index + 1
    }
  })

  return nextPositions
}

function positionsToOrder(positions: Record<string, number>) {
  'worklet'

  return Object.entries(positions)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id)
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

type RowProps = {
  item: ReorderItem
  itemCount: number
  positions: SharedValue<Record<string, number>>
  activeId: SharedValue<string | null>
  activeTop: SharedValue<number>
  dragOffset: SharedValue<number>
  scrollY: SharedValue<number>
  containerTop: SharedValue<number>
  viewportHeight: SharedValue<number>
  onDrop: (orderedIds: string[]) => void
}

const ReorderRow = memo(function ReorderRow({
  item,
  itemCount,
  positions,
  activeId,
  activeTop,
  dragOffset,
  scrollY,
  containerTop,
  viewportHeight,
  onDrop,
}: RowProps) {
  const isDark = useColorScheme() === 'dark'
  const maxTop = Math.max(0, (itemCount - 1) * ROW_HEIGHT)

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      activeId.value = item.id
      const currentTop = positions.value[item.id] * ROW_HEIGHT
      activeTop.value = currentTop
      dragOffset.value = event.absoluteY - containerTop.value + scrollY.value - currentTop
    })
    .onUpdate((event) => {
      if (activeId.value !== item.id) {
        return
      }

      const localY = event.absoluteY - containerTop.value + scrollY.value
      const nextTop = clamp(localY - dragOffset.value, 0, maxTop)
      activeTop.value = nextTop

      const maxScroll = Math.max(0, itemCount * ROW_HEIGHT - viewportHeight.value)
      const pointerY = event.absoluteY - containerTop.value

      if (pointerY < EDGE_SCROLL_THRESHOLD) {
        scrollY.value = clamp(scrollY.value - EDGE_SCROLL_SPEED, 0, maxScroll)
      } else if (pointerY > viewportHeight.value - EDGE_SCROLL_THRESHOLD) {
        scrollY.value = clamp(scrollY.value + EDGE_SCROLL_SPEED, 0, maxScroll)
      }

      const nextIndex = clamp(Math.round(nextTop / ROW_HEIGHT), 0, itemCount - 1)
      if (positions.value[item.id] !== nextIndex) {
        positions.value = movePosition(positions.value, item.id, nextIndex)
      }
    })
    .onFinalize(() => {
      if (activeId.value !== item.id) {
        return
      }

      const orderedIds = positionsToOrder(positions.value)
      activeTop.value = withSpring(positions.value[item.id] * ROW_HEIGHT, {
        ...ROW_SPRING_CONFIG,
      })
      activeId.value = null
      runOnJS(onDrop)(orderedIds)
    })

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeId.value === item.id
    const top = isActive
      ? activeTop.value
      : withSpring(positions.value[item.id] * ROW_HEIGHT, {
          ...ROW_SPRING_CONFIG,
        })

    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top,
      zIndex: isActive ? 100 : 1,
      transform: [{ scale: withSpring(isActive ? 1.02 : 1) }],
    }
  })

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle} className="px-4 py-1">
        <View
          className={`h-[70px] flex-row items-center rounded-2xl border px-4 ${
            isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Ionicons
            name="reorder-three-outline"
            size={20}
            color={isDark ? '#a3a3a3' : '#737373'}
          />

          <Image
            source={item.thumbnailUrl}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              marginLeft: 12,
              marginRight: 12,
              borderWidth: 1,
              borderColor: isDark ? '#404040' : '#d4d4d4',
              backgroundColor: isDark ? '#171717' : '#f5f5f5',
            }}
          />

          <View className="flex-1">
            <Text className="text-base font-semibold text-black dark:text-white">{item.title}</Text>
            {item.instanceLabel ? (
              <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {item.instanceLabel}
              </Text>
            ) : null}
          </View>

          {item.groupLabel ? (
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: item.groupColor ?? '#1f2937' }}
            >
              <Text className="text-xs font-semibold text-white">{item.groupLabel}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  )
})

export default function WorkoutReorderList({ items, onReorder }: Props) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const containerRef = useRef<View>(null)
  const [viewportHeightState, setViewportHeightState] = useState(0)
  const positions = useSharedValue<Record<string, number>>(buildPositions(items))
  const activeId = useSharedValue<string | null>(null)
  const activeTop = useSharedValue(0)
  const dragOffset = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const containerTop = useSharedValue(0)
  const viewportHeight = useSharedValue(0)

  useEffect(() => {
    positions.value = buildPositions(items)
  }, [items, positions])

  useEffect(() => {
    viewportHeight.value = viewportHeightState
  }, [viewportHeight, viewportHeightState])

  const refreshContainerMetrics = () => {
    containerRef.current?.measureInWindow((_, y, __, height) => {
      containerTop.value = y
      viewportHeight.value = height
      setViewportHeightState(height)
    })
  }

  useAnimatedReaction(
    () => scrollY.value,
    (current) => {
      scrollTo(scrollRef, 0, current, false)
    },
    [scrollRef],
  )

  const contentHeight = useMemo(() => items.length * ROW_HEIGHT, [items.length])

  return (
    <View ref={containerRef} className="flex-1" onLayout={refreshContainerMetrics}>
      <AnimatedScrollView
        ref={scrollRef}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: contentHeight }}
      >
        {items.map((item) => (
          <ReorderRow
            key={item.id}
            item={item}
            itemCount={items.length}
            positions={positions}
            activeId={activeId}
            activeTop={activeTop}
            dragOffset={dragOffset}
            scrollY={scrollY}
            containerTop={containerTop}
            viewportHeight={viewportHeight}
            onDrop={onReorder}
          />
        ))}
      </AnimatedScrollView>
    </View>
  )
}
