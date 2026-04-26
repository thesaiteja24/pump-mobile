/**
 * Query Keys
 *
 * Centralised, typed query key factory for the whole app.
 * Keeping keys in one place makes it trivial to invalidate related queries
 * (e.g. after a mutation) and avoids typo-driven cache misses.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
 *   useQuery({ queryKey: queryKeys.exercises.all, ... })
 */

import { LikeType } from '@/types/engagement'

export const queryKeys = {
  me: {
    root: ['me'] as const,

    profile: ['me', 'profile'] as const,

    analyticsRoot: ['me', 'analytics'] as const,
    userAnalytics: ['me', 'analytics', 'user'] as const,
    trainingAnalytics: (duration: string) => ['me', 'analytics', 'training', duration] as const,

    fitnessProfile: ['me', 'fitnessProfile'] as const,
    nutritionPlan: ['me', 'nutritionPlan'] as const,

    measurementsRoot: ['me', 'measurements'] as const,
    measurements: (duration?: string) =>
      duration ? (['me', 'measurements', duration] as const) : (['me', 'measurements'] as const),
  },

  user: {
    byId: (userId: string) => ['user', userId] as const,
  },

  meta: {
    root: ['meta'] as const,
    resource: (resource: 'equipment' | 'muscle-groups') => ['meta', resource] as const,
    all: (resource: 'equipment' | 'muscle-groups') => ['meta', resource, 'list'] as const,
    byId: (resource: 'equipment' | 'muscle-groups', id: string) =>
      ['meta', resource, 'detail', id] as const,
  },

  exercises: {
    root: ['exercises'] as const,
    all: ['exercises', 'list'] as const,
    byId: (id: string) => ['exercises', 'detail', id] as const,
  },

  engagement: {
    root: ['engagement'] as const,

    suggested: ['engagement', 'follow', 'suggestedUsers'] as const,
    searchRoot: ['engagement', 'follow', 'searchUsers'] as const,
    search: (query: string) => ['engagement', 'follow', 'searchUsers', query] as const,

    followRoot: ['engagement', 'follow'] as const,
    followersRoot: ['engagement', 'follow', 'userFollowers'] as const,
    followers: (userId: string) => ['engagement', 'follow', 'userFollowers', userId] as const,
    followingRoot: ['engagement', 'follow', 'userFollowing'] as const,
    following: (userId: string) => ['engagement', 'follow', 'userFollowing', userId] as const,

    commentsRoot: ['engagement', 'comments'] as const,
    comments: (workoutId: string) => ['engagement', 'comments', workoutId] as const,
    repliesRoot: ['engagement', 'replies'] as const,
    replies: (parentId: string) => ['engagement', 'replies', parentId] as const,

    likes: (id: string, type: LikeType) => ['engagement', 'likes', type, id] as const,
  },

  habits: {
    root: ['habits'] as const,
    all: (userId: string) => ['habits', userId, 'list'] as const,
    logsRoot: ['habits', 'logs'] as const,
    logs: (userId: string, startDate?: string, endDate?: string) =>
      ['habits', 'logs', userId, startDate, endDate] as const,
  },

  programs: {
    root: ['programs'] as const,
    all: ['programs', 'list'] as const,
    detail: (id: string) => ['programs', 'detail', id] as const,
    user: {
      root: ['user-programs'] as const,
      all: (userId: string) => ['user-programs', userId, 'list'] as const,
      active: (userId: string) => ['user-programs', userId, 'active'] as const,
      detail: (id: string) => ['user-programs', 'detail', id] as const,
    },
  },

  coach: {
    root: ['coach'] as const,
    conversation: ['coach', 'conversation'] as const,
  },

  templates: {
    all: (userId: string) => ['templates', userId] as const,
    byId: (id: string) => ['templates', id] as const,
    byShareId: (shareId: string) => ['templates', 'shared', shareId] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    discover: ['discoverWorkouts'] as const,
    byId: (id: string) => ['workouts', 'detail', id] as const,
  },
} as const
