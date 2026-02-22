export function createFormData(uri: string, fieldName = 'profilePic') {
	const formData = new FormData()

	// extract filename
	const uriParts = uri.split('/')
	const fileName = uriParts[uriParts.length - 1]

	// mime type guess
	const match = /\.(\w+)$/.exec(fileName)
	const ext = match ? match[1].toLowerCase() : 'jpg'
	const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`

	// On React Native / Expo, append an object with uri, name, type
	// TypeScript may complain, so cast to any
	formData.append(fieldName, {
		uri,
		name: fileName,
		type: mimeType,
	} as any)

	return formData
}
