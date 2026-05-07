import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'
import { GestureResponderEvent, Pressable, Text, View } from 'react-native'
import switchTheme from 'react-native-theme-switch-animation'
import { twMerge } from 'tailwind-merge'

export function UserThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme()
  const isDarkMode = colorScheme === 'dark'

  const handleUserThemeToggle = (e: GestureResponderEvent) => {
    const theme = colorScheme === 'dark' ? 'light' : 'dark'
    e.currentTarget.measure((_x1, _y1, width, height, px, py) => {
      switchTheme({
        switchThemeFunction: () => {
          setTimeout(() => {
            setColorScheme(theme)
          }, 100)
        },
        animationConfig: {
          type: 'inverted-circular',
          duration: 1200,
          startingPoint: {
            cy: py + height / 2,
            cx: px + width / 2,
          },
        },
      })
    })
  }

  return (
    <View className="flex-row items-center justify-between py-2 pr-2">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons
          name="palette-outline"
          size={24}
          color={isDarkMode ? '#D4D4D4' : '#525252'}
          className="ml-4 mr-2"
        />
        <Text className="text-base font-medium text-neutral-700 dark:text-neutral-300">
          App Theme
        </Text>
      </View>

      <View className="flex-row items-center gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
        <Pressable
          onPress={handleUserThemeToggle}
          className={twMerge(
            'flex-row items-center gap-2 rounded-full px-4 py-2',
            colorScheme === 'light' && 'bg-white dark:bg-neutral-800',
          )}
        >
          <Ionicons name="sunny" size={18} color={colorScheme === 'light' ? '#EAB308' : '#737373'} />
          {colorScheme === 'light' && (
            <Text className="text-sm font-semibold text-neutral-900 dark:text-white">Light</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleUserThemeToggle}
          className={twMerge(
            'flex-row items-center gap-2 rounded-full px-4 py-2',
            colorScheme === 'dark' && 'bg-white dark:bg-neutral-800',
          )}
        >
          <Ionicons name="moon" size={18} color={colorScheme === 'dark' ? '#3b82f6' : '#737373'} />
          {colorScheme === 'dark' && (
            <Text className="text-sm font-semibold text-neutral-900 dark:text-white">Dark</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
export default UserThemeToggle
