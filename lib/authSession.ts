let onUnauthorized: (() => void) | null = null

export const registerUnauthorizedHandler = (handler: () => void) => {
	onUnauthorized = handler
}

export const notifyUnauthorized = () => {
	onUnauthorized?.()
}
