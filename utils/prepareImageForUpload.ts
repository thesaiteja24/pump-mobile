import * as ImageManipulator from 'expo-image-manipulator'
import { getTargetImageWidth } from './getTargetImageWidth'
import { ImageUsage } from './imageUploadPresets'

const MAX_ORIGINAL_SIZE_MB = 20

export async function prepareImageForUpload(
	image: {
		uri: string
		fileName?: string
		type?: string
		width?: number
		height?: number
		fileSize?: number
	},
	usage: ImageUsage
) {
	// 1️⃣ Hard reject absurd files early
	if (image.fileSize && image.fileSize > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
		throw new Error('Image too large. Please select a smaller image.')
	}

	const targetWidth = getTargetImageWidth(usage)

	// 2️⃣ Resize + compress
	const manipulated = await ImageManipulator.manipulateAsync(image.uri, [{ resize: { width: targetWidth } }], {
		compress: 0.8,
		format: ImageManipulator.SaveFormat.JPEG,
	})

	// 3️⃣ Normalize output for FormData
	return {
		uri: manipulated.uri,
		name: image.fileName || `upload-${Date.now()}.jpg`,
		type: 'image/jpeg',
	}
}
