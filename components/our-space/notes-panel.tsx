import { PanelHeader } from "@/components/common/panel-header";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { NoteCard } from "@/components/notes/note-card";
import { NotesPanelSkeleton } from "@/components/our-space/tab-skeletons";
import { Button } from "@/components/ui/button";
import type { FilterRange } from "@/lib/dashboard-utils";
import type { SharedNote } from "@/lib/types";
import { EmptyDoodle } from "@/components/common/doodles";

interface NotesPanelProps {
	currentUserId: string;
	filterRange: FilterRange;
	initialNowMs: number;
	loading: boolean;
	notes: SharedNote[];
	timeZone: string;
	onOpenNote: (note: SharedNote) => void;
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
	onOpenNote,
	onEditNote,
	onNoteDeleted,
	onNewNote,
	periodControl,
}: NotesPanelProps) {
	if (loading && notes.length === 0) {
		return <NotesPanelSkeleton />;
	}

	return (
		<div className="grid gap-4 sm:gap-5">
			<PanelHeader title="Shared notes" description="Little letters, everyday thoughts, and things just for us.">
				<div className="sm:hidden">{periodControl}</div>
				{notes.length ? (
					<span className="glass-chip hidden h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground tabular-nums sm:inline-flex">
						{notes.length} {notes.length === 1 ? "note" : "notes"}
					</span>
				) : null}
				<Button
					type="button"
					size="lg"
					className="primary-action hidden h-11 rounded-full px-5 font-semibold sm:inline-flex sm:w-auto"
					onClick={onNewNote}
				>
					<Plus size={17} />
					New note
				</Button>
			</PanelHeader>
			<div className="notes-grid notes-grid--four">
				{notes.length ? (
					notes.map((note) => (
						<NoteCard
							key={note.id}
							note={note}
							currentUserId={currentUserId}
							initialNowMs={initialNowMs}
							timeZone={timeZone}
							onOpen={onOpenNote}
							onEdit={onEditNote}
							onDeleted={onNoteDeleted}
						/>
					))
				) : (
					<div className="app-card col-span-full flex flex-col items-center px-6 py-14 text-center sm:py-20">
						<EmptyDoodle kind="notes" />
						<h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">A little space for your words</h3>
						<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">No notes for this {filterRange} yet. Write a thought for your partner, or choose another period.</p>
					</div>
				)}
			</div>
		</div>
	);
}
