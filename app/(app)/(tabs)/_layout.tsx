import AnimatedButton from '@/components/coach/AnimatedButton'
import CoachModal, { CoachModalHandle } from '@/components/coach/CoachModal'
import CustomHeader from '@/components/navigation/CustomHeader'

import { useThemeColor } from '@/hooks/useThemeColor'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Tabs } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Pressable, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabsLayout() {
	const colors = useThemeColor()
	const isDark = useColorScheme() === 'dark'
	const insets = useSafeAreaInsets()

	const [home, setHome] = useState(true)
	const [workout, setworkout] = useState(false)
	const [profile, setProfile] = useState(false)

	const pillBg = isDark ? '#111111' : '#F2F2F2'
	const barBg = colors.background
	const barBorder = isDark ? '#222222' : '#DDDDDD'
	const activeColor = colors.text
	const inactiveColor = '#A8A8A8'

	const coachModalRef = useRef<CoachModalHandle>(null)

	return (
		<>
			<Tabs
				screenOptions={{
					tabBarShowLabel: false,

					// ---- COLORS ----
					tabBarActiveTintColor: activeColor,
					tabBarInactiveTintColor: inactiveColor,

					// ---- BAR CONTAINER ----
					tabBarStyle: {
						position: 'absolute',
						left: 0,
						right: 0,
						marginLeft: '10%',
						marginRight: '30%',
						bottom: insets.bottom,
						height: 52,
						borderRadius: 100,
						backgroundColor: barBg,
						borderWidth: 1,
						borderColor: barBorder,

						shadowColor: isDark ? '#fff' : '#000',
						shadowOpacity: 0.08,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 2,
					},

					// ---- HEADER ----
					header: props => {
						const { options } = props
						const custom = options as any

						if (options.headerShown === false) return null

						return (
							<CustomHeader
								title={options.title ?? ''}
								leftIcon={custom.leftIcon}
								onLeftPress={custom.onLeftPress}
								rightIcons={custom.rightIcons}
							/>
						)
					},
				}}
			>
				<Tabs.Screen
					name="discover"
					options={{
						title: 'Discover',
						headerShown: false,
						tabBarItemStyle: {
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 24,
							marginHorizontal: 6,
							marginVertical: 6,
							height: 40,
							// backgroundColor: home ? pillBg : "transparent",
						},
						tabBarButton: props => {
							const { ref, ...rest } = props
							return (
								<Pressable
									{...rest}
									onPress={e => {
										props.onPress?.(e)
										setHome(true)
										setworkout(false)
										setProfile(false)
									}}
								/>
							)
						},
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons name={focused ? 'globe' : 'globe-outline'} size={size ?? 24} color={color} />
						),
					}}
				/>

				<Tabs.Screen
					name="home"
					options={{
						title: 'Home',
						headerShown: false,
						tabBarItemStyle: {
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 24,
							marginHorizontal: 6,
							marginVertical: 6,
							height: 40,
							// backgroundColor: home ? pillBg : "transparent",
						},
						tabBarButton: props => {
							const { ref, ...rest } = props
							return (
								<Pressable
									{...rest}
									onPress={e => {
										props.onPress?.(e)
										setHome(true)
										setworkout(false)
										setProfile(false)
									}}
								/>
							)
						},
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons name={focused ? 'home' : 'home-outline'} size={size ?? 22} color={color} />
						),
					}}
				/>

				<Tabs.Screen
					name="workout"
					options={{
						title: 'Workout',
						headerShown: false,
						// ---- ITEM ----
						tabBarItemStyle: {
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 100,
							marginHorizontal: 6,
							marginVertical: 6,
							height: 40,
							// backgroundColor: workout ? pillBg : "transparent",
						},
						tabBarButton: props => {
							const { ref, ...rest } = props
							return (
								<Pressable
									{...rest}
									onPress={e => {
										props.onPress?.(e)
										setHome(false)
										setworkout(true)
										setProfile(false)
									}}
								/>
							)
						},
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons
								name={focused ? 'accessibility-sharp' : 'accessibility-outline'}
								size={size ?? 22}
								color={color}
							/>
						),
					}}
				/>

				<Tabs.Screen
					name="profile"
					options={{
						title: 'Profile',
						headerShown: false,
						// ---- ITEM ----
						tabBarItemStyle: {
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 24,
							marginHorizontal: 6,
							marginVertical: 6,
							height: 40,
							// backgroundColor: profile ? pillBg : "transparent",
						},
						tabBarButton: props => {
							const { ref, ...rest } = props
							return (
								<Pressable
									{...rest}
									onPress={e => {
										props.onPress?.(e)
										setHome(false)
										setworkout(false)
										setProfile(true)
									}}
								/>
							)
						},
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons name={focused ? 'person' : 'person-outline'} size={size ?? 22} color={color} />
						),
					}}
				/>
			</Tabs>
			<View
				style={{
					position: 'absolute',
					right: 0,
					marginRight: '10%',
					bottom: insets.bottom,
					height: 52,
					shadowOpacity: 0.15,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 4 },
					elevation: 4,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<AnimatedButton
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
						coachModalRef.current?.present()
					}}
				/>
			</View>
			<CoachModal ref={coachModalRef} />
		</>
	)
}
