import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'

/**
 * EditableAvatar
 *
 * Displays a user's avatar with optional editing capability.
 * Users can tap the image to pick a new picture from their library.
 *
 * @param uri - The current image URI
 * @param size - Width/height of the avatar in pixels (default 120)
 * @param editable - Whether the avatar can be changed (default true)
 * @param uploading - Whether the avatar is currently uploading (shows loader)
 * @param onChange - Callback when a new image is selected
 * @param borderColor - Border color around the avatar (default #d1d5db)
 * @param borderWidth - Border width (default 2)
 * @param pencilSize - Size of the edit pencil icon (default 18)
 * @param pencilColor - Pencil icon color (default #fff)
 * @param pencilBg - Pencil background color (default #1e90ff)
 * @param shape - Avatar shape: "circle" | "rounded" | "square" (default "circle")
 */
type EditableAvatarProps = {
	uri?: string | null
	size?: number
	editable?: boolean
	uploading?: boolean
	onChange?: (newUri: string | null) => void

	borderColor?: string
	borderWidth?: number

	pencilSize?: number
	pencilColor?: string
	pencilBg?: string

	shape?: 'circle' | 'rounded' | 'square'
}

export default function EditableAvatar({
	uri = null,
	size = 120,
	editable = true,
	uploading = false,
	onChange,

	borderColor = '#d1d5db',
	borderWidth = 2,

	pencilSize = 18,
	pencilColor = '#fff',
	pencilBg = '#1e90ff',

	shape = 'circle',
}: EditableAvatarProps) {
	const [loading, setLoading] = useState(false)

	const pickImage = async () => {
		if (!editable) return
		try {
			setLoading(true)

			const res = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				aspect: [1, 1],
				allowsEditing: true,
				quality: 0.9,
			})

			if (!res.canceled) {
				const newUri = res.assets[0].uri
				onChange?.(newUri)
			}
		} catch (err) {
			console.log('Image picking error:', err)
		} finally {
			setLoading(false)
		}
	}

	const radius = shape === 'circle' ? size / 2 : shape === 'rounded' ? size * 0.2 : 0

	return (
		<View style={{ width: size, height: size }}>
			{/* Image */}
			<TouchableOpacity
				activeOpacity={editable ? 0.8 : 1}
				onPress={pickImage}
				style={{
					width: size,
					height: size,
					borderRadius: radius,
					overflow: 'hidden',
					borderWidth,
					borderColor,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#e5e7eb',
				}}
			>
				{loading || uploading ? (
					<ActivityIndicator size="small" color="#555" />
				) : (
					<Image
						cachePolicy={'memory-disk'}
						source={uri ? { uri } : require('../assets/images/icon.png')}
						style={{ width: '100%', height: '100%' }}
						contentFit="cover"
					/>
				)}
			</TouchableOpacity>

			{/* Pencil icon */}
			{editable && (
				<TouchableOpacity
					onPress={pickImage}
					style={{
						position: 'absolute',
						bottom: 4,
						right: 4,
						backgroundColor: pencilBg,
						width: pencilSize + 16,
						height: pencilSize + 16,
						borderRadius: (pencilSize + 16) / 2,
						justifyContent: 'center',
						alignItems: 'center',
						shadowColor: '#000',
						shadowOpacity: 0.2,
						shadowRadius: 4,
						elevation: 2,
					}}
				>
					<Ionicons name="pencil" size={pencilSize} color={pencilColor} />
				</TouchableOpacity>
			)}
		</View>
	)
}
