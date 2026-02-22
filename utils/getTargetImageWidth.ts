import { PixelRatio } from 'react-native'
import { IMAGE_PRESETS, ImageUsage } from './imageUploadPresets'

export function getTargetImageWidth(usage: ImageUsage) {
	const preset = IMAGE_PRESETS[usage]
	const dpr = Math.min(PixelRatio.get(), 3) // clamp DPR (important)

	const target = Math.round(preset.cssSize * dpr)

	return Math.min(target, preset.maxWidth)
}
