export const ROLES = Object.freeze({
	systemAdmin: 'systemAdmin',
	gymAdmin: 'gymAdmin',
	trainer: 'trainer',
	member: 'member',
})

export type Role = (typeof ROLES)[keyof typeof ROLES]
