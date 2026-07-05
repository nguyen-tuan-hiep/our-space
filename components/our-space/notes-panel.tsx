import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { NoteCard } from "@/components/notes/note-card";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { SharedNote } from "@/lib/types";
import { primaryButtonClass } from "./shared-classes";

interface NotesPanelProps {
	currentUserId: string;
	filterRange: FilterRange;
	initialNowMs: number;
	loading: boolean;
	notes: SharedNote[];
	timeZone: string;
	onEditNote: (note: SharedNote) => void;
	onNewNote: () => void;
	periodControl?: ReactNode;
}

export function NotesPanel({
	currentUserId,
	filterRange,
	initialNowMs,
	loading,
	notes,
	timeZone,
	onEditNote,
	onNewNote,
	periodControl,
}: NotesPanelProps) {
	return (
		<div className="grid gap-4 sm:gap-5">
			<div className="flex items-center justify-between gap-4 sm:items-end">
				<div className="min-w-0">
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Shared notes
					</h2>
				</div>
				<div className="sm:hidden">{periodControl}</div>
				<button
					type="button"
					className={`${primaryButtonClass} hidden sm:inline-flex sm:w-auto`}
					onClick={onNewNote}
				>
					<Plus size={17} />
					New note
				</button>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{notes.length ? (
					notes.map((note) => (
						<NoteCard
							key={note.id}
							note={note}
							currentUserId={currentUserId}
							initialNowMs={initialNowMs}
							timeZone={timeZone}
							onEdit={onEditNote}
						/>
					))
				) : loading ? (
					<div className="rounded-[1.5rem] border border-neutral-200 bg-paper p-6 text-neutral-500 shadow-sm sm:rounded-none sm:shadow-none md:col-span-3 xl:col-span-4">
						Loading notes...
						<div className="mx-auto mt-4 h-1.5 w-44 items-center overflow-hidden rounded-full">
							<div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
						</div>
					</div>
				) : (
					<p className="rounded-[1.5rem] border border-neutral-200 bg-paper p-6 text-neutral-500 shadow-sm sm:col-span-2 sm:rounded-lg sm:shadow-none md:col-span-3 lg:col-span-4">
						No notes for this {filterRange}.
					</p>
				)}
			</div>
		</div>
	);
}
