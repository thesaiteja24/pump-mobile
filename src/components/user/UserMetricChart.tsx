import { Ionicons } from '@expo/vector-icons'
import { format, subMonths, subWeeks, subYears } from 'date-fns'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, Dimensions, Pressable, ScrollView, Text, View } from 'react-native'
import { BarChart, LineChart } from 'react-native-chart-kit'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useThemeColor } from '@/hooks/theme'
import { TrainingAnalyticsItem } from '@/types/me'

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All'

interface UserMetricChartProps {
  title: string
  data: TrainingAnalyticsItem[]
  isLoading: boolean
  unit: string
  accentColor: string
  icon: keyof typeof Ionicons.glyphMap
  formatValue?: (val: number) => string
  defaultChartType?: 'line' | 'bar'
}

export function UserMetricChart({
  title,
  data,
  isLoading,
  unit,
  accentColor,
  icon,
  formatValue = (val) => val.toLocaleString(),
  defaultChartType = 'bar',
}: UserMetricChartProps) {
  const router = useRouter()
  const colors = useThemeColor()
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M')
  const [chartType, setChartType] = useState<'line' | 'bar'>(defaultChartType)

  // ── Filtering Logic ───────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (data.length === 0) return []

    const now = new Date()
    let startDate: Date | null = null

    switch (selectedRange) {
      case '1W':
        startDate = subWeeks(now, 1)
        break
      case '1M':
        startDate = subMonths(now, 1)
        break
      case '3M':
        startDate = subMonths(now, 3)
        break
      case '6M':
        startDate = subMonths(now, 6)
        break
      case '1Y':
        startDate = subYears(now, 1)
        break
      case 'All':
        startDate = null
        break
    }

    const filtered = startDate
      ? data.filter((item) => new Date(item.date) >= startDate!)
      : data

    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, selectedRange])

  // ── Stats Calculation ─────────────────────────────────────────
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { avg: 0, diff: 0, rangeStr: '', min: 0, max: 0 }

    const values = filteredData.map((m) => m.value)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const diff = values[values.length - 1] - (values[0] || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)

    const startStr = format(new Date(filteredData[0].date), 'MMM d')
    const endStr = format(new Date(filteredData[filteredData.length - 1].date), 'MMM d, yyyy')

    return {
      avg,
      diff,
      min,
      max,
      rangeStr: `${startStr} – ${endStr}`,
    }
  }, [filteredData])

  // ── Chart Preparation ─────────────────────────────────────────
  const chartConfig = useMemo(() => {
    if (filteredData.length === 0) return { labels: [], datasets: [{ data: [0] }] }

    const values = filteredData.map((m) => m.value)

    const labels = filteredData.map((m, i) => {
      if (selectedRange === '1W') return format(new Date(m.date), 'EEE')
      if (i === 0 || i === filteredData.length - 1 || i === Math.floor(filteredData.length / 2)) {
        return format(new Date(m.date), 'MMM d')
      }
      return ''
    })

    return {
      labels,
      datasets: [
        {
          data: values,
          color: () => accentColor,
          strokeWidth: 2,
        },
      ],
    }
  }, [filteredData, selectedRange, accentColor])

  const ranges: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'All']
  const screenWidth = Dimensions.get('window').width

  const chartWidth = useMemo(() => {
    const minWidth = screenWidth - 16
    const dataDependentWidth = filteredData.length * 60
    return Math.max(minWidth, dataDependentWidth)
  }, [filteredData.length, screenWidth])

  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: false })
  }, [selectedRange])

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back()
      } else {
        router.push('/(app)/(tabs)/home')
      }
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [router])

  // Helper to get RGB from Hex for chart opacity
  const getRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
      <ScrollView className="flex-1">
        {/* Statistics Header */}
        <View className="p-6 pt-0">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Average
              </Text>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-3xl font-bold text-black dark:text-white">
                  {formatValue(stats.avg)}
                </Text>
                <Text className="text-sm font-medium text-neutral-500">{unit}</Text>
              </View>
              <Text className="mt-1 text-xs text-neutral-400">{stats.rangeStr}</Text>
            </View>

            <View className="items-end">
              <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Difference
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name={stats.diff >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={stats.diff >= 0 ? '#10b981' : '#ef4444'}
                />
                <Text
                  className={`text-xl font-bold ${stats.diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {stats.diff >= 0 ? '+' : ''}
                  {formatValue(stats.diff)}
                </Text>
                <Text className="text-sm font-medium text-neutral-500">{unit}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chart Type Toggle */}
        <View className="mb-4 flex-row items-center justify-end px-6">
          <View className="flex-row rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900">
            <Pressable
              onPress={() => setChartType('line')}
              className={`rounded-md px-3 py-1 ${chartType === 'line' ? 'bg-white dark:bg-neutral-800' : ''}`}
            >
              <Ionicons
                name="trending-up-outline"
                size={18}
                color={chartType === 'line' ? (colors.isDark ? '#fff' : '#000') : '#737373'}
              />
            </Pressable>
            <Pressable
              onPress={() => setChartType('bar')}
              className={`rounded-md px-3 py-1 ${chartType === 'bar' ? 'bg-white dark:bg-neutral-800' : ''}`}
            >
              <Ionicons
                name="bar-chart-outline"
                size={18}
                color={chartType === 'bar' ? (colors.isDark ? '#fff' : '#000') : '#737373'}
              />
            </Pressable>
          </View>
        </View>

        {/* Chart Container */}
        <View className="h-64 justify-center">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-neutral-400">Loading chart...</Text>
            </View>
          ) : filteredData.length > 0 ? (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 40 }}
            >
              {chartType === 'line' ? (
                <LineChart
                  data={chartConfig}
                  width={chartWidth}
                  height={220}
                  bezier
                  chartConfig={{
                    backgroundColor: colors.isDark ? '#000' : '#fff',
                    backgroundGradientFrom: colors.isDark ? '#000' : '#fff',
                    backgroundGradientTo: colors.isDark ? '#000' : '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(${getRgb(accentColor)}, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      colors.isDark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: accentColor,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '5, 5',
                      stroke: colors.isDark ? '#262626' : '#f5f5f5',
                    },
                  }}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withDots={filteredData.length < 50}
                  withInnerLines={true}
                  withOuterLines={false}
                  withShadow={true}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              ) : (
                <BarChart
                  data={chartConfig}
                  width={chartWidth}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  withInnerLines={true}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  chartConfig={{
                    backgroundColor: colors.isDark ? '#000' : '#fff',
                    backgroundGradientFrom: colors.isDark ? '#000' : '#fff',
                    backgroundGradientTo: colors.isDark ? '#000' : '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(${getRgb(accentColor)}, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      colors.isDark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForBackgroundLines: {
                      strokeDasharray: '5, 5',
                      stroke: colors.isDark ? '#262626' : '#f5f5f5',
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              )}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center p-10">
              <Text className="text-center text-neutral-400">
                Not enough data for this period. Keep logging to see trends!
              </Text>
            </View>
          )}
        </View>

        {/* Time Range Selector */}
        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-between rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
            {ranges.map((range) => (
              <Pressable
                key={range}
                onPress={() => setSelectedRange(range)}
                className={`flex-1 items-center rounded-full py-2 ${
                  selectedRange === range ? 'bg-black dark:bg-white' : ''
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedRange === range
                      ? 'text-white dark:text-black'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {range}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Summary Details */}
        <View className="mt-8 gap-4 px-6">
          <View className="flex-row gap-4">
            <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <Text className="text-xs font-semibold uppercase text-neutral-500">Minimum</Text>
              <Text className="mt-1 text-lg font-bold text-black dark:text-white">
                {formatValue(stats.min)} {unit}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <Text className="text-xs font-semibold uppercase text-neutral-500">Maximum</Text>
              <Text className="mt-1 text-lg font-bold text-black dark:text-white">
                {formatValue(stats.max)} {unit}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row items-center gap-2">
              <Ionicons name={icon} size={18} color="#737373" />
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {title} Insights
              </Text>
            </View>
            <Text className="mt-2 text-sm text-neutral-500">
              In the last {selectedRange === 'All' ? 'period' : selectedRange}, your {title.toLowerCase()}{' '}
              has {stats.diff > 0 ? 'increased' : 'decreased'} by{' '}
              {formatValue(Math.abs(stats.diff))} {unit}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
