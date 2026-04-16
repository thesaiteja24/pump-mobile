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

import {
	DraftProgram,
	Program,
} from '@/types/program'
import * as Crypto from 'expo-crypto'
import { create } from 'zustand'


// ─── Draft State (pure UI — no network calls) ───────────────────────────────

interface ProgramDraftState {
	draftProgram: DraftProgram | null
	startDraftProgram: (program?: Program) => void
	updateDraftProgram: (patch: Partial<DraftProgram>) => void
	discardDraftProgram: () => void
}

function toDraftProgram(program: Program): DraftProgram {
	return {
		id: program.id,
		clientId: program.clientId,
		title: program.title,
		description: program.description ?? '',
		experienceLevel: program.experienceLevel,
		durationOptions: program.durationOptions,
		weeks: program.weeks
			.map(week => ({
				id: week.id,
				programId: week.programId,
				name: week.name,
				weekIndex: week.weekIndex,
				key: week.key || Crypto.randomUUID(),
				days: week.days
					.map(day => ({
						id: day.id,
						weekId: day.weekId,
						name: day.name,
						dayIndex: day.dayIndex,
						isRestDay: day.isRestDay,
						templateId: day.isRestDay ? null : (day.templateId ?? null),
						key: day.key || Crypto.randomUUID(),
					}))
					.sort((a, b) => a.dayIndex - b.dayIndex),
			}))
			.sort((a, b) => a.weekIndex - b.weekIndex),
	}
}

export const useProgram = create<ProgramDraftState>(set => ({
	draftProgram: null,

	startDraftProgram: program => {
		if (program) {
			set({ draftProgram: toDraftProgram(program) })
		} else {
			const newDraft: DraftProgram = {
				id: '',
				clientId: Crypto.randomUUID(),
				title: '',
				description: '',
				experienceLevel: 'beginner',
				durationOptions: [4],
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
							isRestDay: false,
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
