export const authEndpoints = {
  googleSignIn: '/auth/google',
  logout: '/auth/logout',
} as const

export const userEndpoints = {
  private: {
    profile: '/users/me',
    fitness: '/users/me/fitness',
    nutrition: '/users/me/nutrition',
    measurements: '/users/me/measurements',
    measurementsItem: (measurementId: string) => `/users/me/measurements/${measurementId}`,
    analytics: '/users/me/analytics',
  },
  public: {

  },
} as const

export const habitEndpoints = {
  list: '/habits',
  internal: '/habits/internal',
  toggleInternal: (metric: string) => `/habits/internal/${metric}`,
  today: '/habits/today',
  item: (habitId: string) => `/habits/${habitId}`,
  stats: (habitId: string) => `/habits/${habitId}/stats`,
  log: (habitId: string, date: string) => `/habits/${habitId}/logs/${date}`,
  reminders: (habitId: string) => `/habits/${habitId}/reminders`,
  reminder: (habitId: string, reminderId: string) => `/habits/${habitId}/reminders/${reminderId}`,
} as const
