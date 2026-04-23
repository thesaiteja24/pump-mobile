import AnimatedButton from '@/components/coach/AnimatedButton'
import CoachModal, { CoachModalHandle } from '@/components/coach/CoachModal'
import CustomHeader from '@/components/navigation/CustomHeader'

import { useThemeColor } from '@/hooks/useThemeColor'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { Tabs } from 'expo-router'
import React, { useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabsLayout() {
	const colors = useThemeColor()
	const isDark = true
	const insets = useSafeAreaInsets()

	const barBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(17, 24, 39, 0.08)'
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
						// backgroundColor: barBg,
						borderWidth: 1,
						borderColor: barBorder,
						zIndex: 2,
						overflow: 'hidden',

						shadowColor: isDark ? '#fff' : '#000',
						shadowOpacity: 0.08,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 2,
					},
					tabBarBackground: () => (
						<BlurView
							intensity={isDark ? 20 : 20}
							tint={isDark ? 'dark' : 'light'}
							experimentalBlurMethod="dimezisBlurView"
							style={StyleSheet.absoluteFill}
						/>
					),

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

			{/* <View
				pointerEvents="none"
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					height: insets.bottom,
					zIndex: 1,
					elevation: 0,
				}}
			>
				<BlurView
					intensity={isDark ? 20 : 20}
					tint={isDark ? 'dark' : 'light'}
					experimentalBlurMethod="dimezisBlurView"
					style={StyleSheet.absoluteFill}
				/>

				<LinearGradient
					pointerEvents="none"
					colors={[
						isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)',
						isDark ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.22)',
					]}
					start={{ x: 0.5, y: 0 }}
					end={{ x: 0.5, y: 1 }}
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 0,
						height: 22,
					}}
				/>
			</View> */}

			<View
				style={{
					position: 'absolute',
					right: 0,
					marginRight: '10%',
					bottom: insets.bottom,
					height: 52,
					zIndex: 2,
					elevation: 6,
					shadowOpacity: 0.15,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 4 },
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
