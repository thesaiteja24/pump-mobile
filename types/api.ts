export type ApiResponse<T = any> = {
	success: boolean
	message?: string
	data: T | null
	errors: any[]
	statusCode: number
}
