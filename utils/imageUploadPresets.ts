export type ImageUsage = 'avatar' | 'icon' | 'equipment' | 'post' | 'fullscreen'

export const IMAGE_PRESETS: Record<
	ImageUsage,
	{
		cssSize: number
		maxWidth: number
		aspect?: 'square' | 'portrait' | 'landscape' | 'any'
	}
> = {
	avatar: {
		cssSize: 96,
		maxWidth: 256,
		aspect: 'square',
	},

	icon: {
		cssSize: 160,
		maxWidth: 512,
		aspect: 'square',
	},

	equipment: {
		cssSize: 200,
		maxWidth: 800,
		aspect: 'square',
	},

	post: {
		cssSize: 360,
		maxWidth: 1080,
		aspect: 'any',
	},

	fullscreen: {
		cssSize: 400,
		maxWidth: 1920,
		aspect: 'any',
	},
}
