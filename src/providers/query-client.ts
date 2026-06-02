/**
 * Re-export the shared queryClient singleton so it can be imported
 * by the auth store (which needs to call queryClient.clear() on logout)
 * without creating circular dependencies through the provider tree.
 */
export { queryClient } from '@/lib/query-client'
