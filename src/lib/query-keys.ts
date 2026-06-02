/**
 * Centralised query key factory.
 *
 * All query keys live here so that cache invalidation and key sharing
 * between queries and mutations are consistent across the codebase.
 *
 * Naming convention: <namespace>.<entity>.<variant?>
 *
 * @example
 * queryClient.invalidateQueries({ queryKey: queryKeys.me.profile() })
 */

export const queryKeys = {
  me: {
    all: ['me'] as const,
    profile: () => ['me', 'profile'] as const,
    fitness: () => ['me', 'fitness'] as const,
    nutrition: () => ['me', 'nutrition'] as const,
    measurements: (duration?: string) =>
      duration ? ['me', 'measurements', duration] as const : ['me', 'measurements'] as const,
    analytics: () => ['me', 'analytics'] as const,
  },
} as const
