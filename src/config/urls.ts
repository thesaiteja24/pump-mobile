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
