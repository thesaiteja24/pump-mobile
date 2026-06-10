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
  habits: {
    all: ['habits'] as const,
    lists: () => [...queryKeys.habits.all, 'list'] as const,
    list: () => [...queryKeys.habits.lists(), 'all'] as const,
    internal: () => [...queryKeys.habits.lists(), 'internal'] as const,
    today: () => [...queryKeys.habits.all, 'today'] as const,
    detail: (habitId: string) => [...queryKeys.habits.all, 'detail', habitId] as const,
    reminders: (habitId: string) => [...queryKeys.habits.all, 'reminders', habitId] as const,
    stats: (habitId: string) => [...queryKeys.habits.all, 'stats', habitId] as const,
  },
} as const
