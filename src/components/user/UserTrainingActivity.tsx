import { endOfWeek, format } from 'date-fns'
import { useMemo, useState } from 'react'
import { Dimensions, ScrollView, Text, View } from 'react-native'
import { BarChart } from 'react-native-chart-kit'

import { useThemeColor } from '@/hooks/theme'
import { TrainingAnalytics } from '@/types/me'

interface AthleteTrainingAnalyticsProps {
  userId: string
  analytics?: TrainingAnalytics
}

export function UserTrainingActivity({ userId, analytics }: AthleteTrainingAnalyticsProps) {
  const isDark = useThemeColor().isDark
  const [activeIndex, setActiveIndex] = useState(0)
  const screenWidth = Dimensions.get('window').width
  const cardWidth = screenWidth - 42

  const chartPages = useMemo(() => {
    if (!analytics) {
      return []
    }

    const aggregateToWeeks = (data: { date: string; value: number }[]) => {
      const weeksMap: Record<string, number> = {}

      data.forEach((item) => {
        const date = new Date(item.date)
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
        const weekKey = format(weekEnd, 'yyyy-MM-dd')
        weeksMap[weekKey] = (weeksMap[weekKey] || 0) + item.value
      })

      return Object.entries(weeksMap)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-6) // Show last 6 weeks
    }

    return [
      {
        title: 'Weekly Volume',
        metric: 'Volume',
        unit: 'kg',
        color: '#10b981',
        data: aggregateToWeeks(analytics.volume),
      },
      {
        title: 'Weekly Duration',
        metric: 'Duration',
        unit: 'min',
        color: '#8b5cf6',
        data: aggregateToWeeks(analytics.duration).map((d) => ({
          ...d,
          value: Math.round(d.value / 60),
        })),
      },
      {
        title: 'Weekly Reps',
        metric: 'Reps',
        unit: 'reps',
        color: '#f59e0b',
        data: aggregateToWeeks(analytics.reps),
      },
    ]
  }, [analytics])

  const onScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x
    const index = Math.round(x / cardWidth)
    if (index !== activeIndex) {
      setActiveIndex(index)
    }
  }

  if (!analytics || chartPages.length === 0) {
    return (
      <View className="h-48 items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <Text className="text-neutral-500">Loading analytics...</Text>
      </View>
    )
  }

  return (
    <View className="h-72 gap-2 rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <Text className="text-lg font-bold text-neutral-900 dark:text-white">
        {chartPages[activeIndex].title}
      </Text>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={cardWidth}
        className="px-auto"
      >
        {chartPages.map((page, index) => {
          const chartData = {
            labels: page.data.map((d) => format(new Date(d.date), 'MMM d')),
            datasets: [
              {
                data: page.data.map((d) => d.value),
              },
            ],
          }

          return (
            <View key={index}>
              {page.data.length > 0 ? (
                <BarChart
                  data={chartData}
                  width={cardWidth - 40}
                  height={180} // Smaller height
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  withInnerLines={true} // Add grid
                  chartConfig={{
                    backgroundColor: isDark ? '#171717' : '#fff',
                    backgroundGradientFrom: isDark ? '#171717' : '#fff',
                    backgroundGradientTo: isDark ? '#171717' : '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) =>
                      page.color === '#8b5cf6'
                        ? `rgba(139, 92, 246, ${opacity})`
                        : page.color === '#10b981'
                          ? `rgba(16, 185, 129, ${opacity})`
                          : `rgba(245, 158, 11, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                    barPercentage: 0.5,
                    propsForBackgroundLines: {
                      strokeDasharray: '6, 6',
                      strokeWidth: 1,
                      stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    },
                  }}
                  style={{
                    paddingRight: 50,
                    // paddingTop: 9,
                  }}
                  verticalLabelRotation={0}
                />
              ) : (
                <View className="h-[150px] items-center justify-center">
                  <Text className="text-neutral-500">No data available</Text>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      <View className="flex-row justify-center gap-2">
        {chartPages.map((_, index) => (
          <View
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${
              activeIndex === index
                ? 'bg-neutral-900 dark:bg-white'
                : 'bg-neutral-200 dark:bg-neutral-800'
            }`}
          />
        ))}
      </View>
    </View>
  )
}
