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
}: NotesPanelProps) {
	return (
		<div className="grid gap-5">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="mt-2 font-serif text-4xl sm:text-5xl">
						Shared notes
					</h2>
				</div>
				<button
					type="button"
					className={`${primaryButtonClass} w-full sm:w-auto`}
					onClick={onNewNote}
				>
					<Plus size={17} />
					New note
				</button>
			</div>
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
					<div className="border border-neutral-200 bg-paper p-6 text-neutral-500 md:col-span-3 xl:col-span-4">
						Loading notes...
						<div className="mx-auto mt-4 h-1.5 w-44 items-center overflow-hidden rounded-full">
							<div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
						</div>
					</div>
				) : (
					<p className="border border-neutral-200 bg-paper p-6 text-neutral-500 sm:col-span-2 md:col-span-3 lg:col-span-4 rounded-lg">
						No notes for this {filterRange}.
					</p>
				)}
			</div>
		</div>
	);
}
