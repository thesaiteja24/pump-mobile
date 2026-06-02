export const queryKeys = {
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    fitness: () => [...queryKeys.user.all, 'fitness'] as const,
    nutrition: () => [...queryKeys.user.all, 'nutrition'] as const,
    measurements: () => [...queryKeys.user.all, 'measurements'] as const,
    measurementList: (duration?: string) => [...queryKeys.user.measurements(), { duration }] as const,
    analytics: () => [...queryKeys.user.all, 'analytics'] as const,
  },
} as const
