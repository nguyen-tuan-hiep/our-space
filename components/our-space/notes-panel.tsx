import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { NoteCard } from "@/components/notes/note-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { SharedNote } from "@/lib/types";

interface NotesPanelProps {
	currentUserId: string;
	filterRange: FilterRange;
	initialNowMs: number;
	loading: boolean;
	notes: SharedNote[];
	timeZone: string;
	onEditNote: (note: SharedNote) => void;
	onNoteDeleted: (noteId: string) => void;
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
	onNoteDeleted,
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
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-2xl px-5 font-bold sm:inline-flex sm:w-auto"
					onClick={onNewNote}
				>
					<Plus size={17} />
					New note
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{notes.length ? (
					notes.map((note) => (
						<NoteCard
							key={note.id}
							note={note}
							currentUserId={currentUserId}
							initialNowMs={initialNowMs}
							timeZone={timeZone}
							onEdit={onEditNote}
							onDeleted={onNoteDeleted}
						/>
					))
				) : loading ? (
					Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="app-card content-fade-in grid h-[20rem] gap-4 p-5"
						>
							<div className="space-y-3">
								<Skeleton className="h-3 w-28 rounded-full" />
								<Skeleton className="h-7 w-3/4 rounded-xl" />
							</div>
							<Skeleton className="min-h-0 flex-1 rounded-2xl" />
						</div>
					))
				) : (
					<div className="app-card content-fade-in p-6 text-neutral-500 sm:col-span-2 md:col-span-3 lg:col-span-4">
						No notes for this {filterRange}.
					</div>
				)}
			</div>
		</div>
	);
}
