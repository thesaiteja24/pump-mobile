/**
 * programStore — Phase 2 refactor
 *
 * Server-fetched READ data (programs list, program detail) is now managed
 * by TanStack Query via `hooks/queries/usePrograms.ts`.
 *
 * This store now only manages `draftProgram` — the local form state used
 * while creating or editing a program. No network calls live here.
 *
 * Type exports are kept so existing imports compile without changes.
 */

import * as Crypto from 'expo-crypto'
import { create } from 'zustand'
import { WorkoutTemplate } from './template/types'

// ─── Type Exports (consumed by service layer / serializer) ──────────────────

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ProgramDay {
	id: string
	weekId: string
	name: string
	dayIndex: number
	isRestDay: boolean
	templateId: string | null
	template?: WorkoutTemplate | null
	key?: string // frontend stability key
}

export interface ProgramWeek {
	id: string
	programId: string
	name: string
	weekIndex: number
	days: ProgramDay[]
	key?: string // frontend stability key
}

export interface Program {
	id: string
	clientId: string
	title: string
	description: string
	experienceLevel: FitnessLevel
	durationOptions: number[]
	createdBy: string
	createdAt: string
	updatedAt: string
	deletedAt: string
	weeks: ProgramWeek[]
}

// ─── Draft State (pure UI — no network calls) ───────────────────────────────

interface ProgramDraftState {
	draftProgram: Program | null
	startDraftProgram: (program?: Program) => void
	updateDraftProgram: (patch: Partial<Program>) => void
	discardDraftProgram: () => void
}

export const useProgram = create<ProgramDraftState>(set => ({
	draftProgram: null,

	startDraftProgram: program => {
		if (program) {
			// Deep clone and stamp stability keys
			const draft = JSON.parse(JSON.stringify(program)) as Program
			draft.weeks.forEach(w => {
				w.key = w.key || Crypto.randomUUID()
				w.days.forEach(d => {
					d.key = d.key || Crypto.randomUUID()
				})
			})
			set({ draftProgram: draft })
		} else {
			const newDraft: Program = {
				id: '',
				clientId: Crypto.randomUUID(),
				title: '',
				description: '',
				experienceLevel: 'beginner',
				durationOptions: [4],
				createdBy: '',
				createdAt: '',
				updatedAt: '',
				deletedAt: '',
				weeks: [
					{
						id: '',
						programId: '',
						name: 'Week 1',
						weekIndex: 0,
						key: Crypto.randomUUID(),
						days: Array.from({ length: 7 }).map((_, i) => ({
							id: '',
							weekId: '',
							name: `Day ${i + 1}`,
							dayIndex: i,
							isRestDay: true,
							templateId: null,
							key: Crypto.randomUUID(),
						})),
					},
				],
			}
			set({ draftProgram: newDraft })
		}
	},

	updateDraftProgram: patch => {
		set(state => {
			if (!state.draftProgram) return state
			return { draftProgram: { ...state.draftProgram, ...patch } }
		})
	},

	discardDraftProgram: () => set({ draftProgram: null }),
}))
