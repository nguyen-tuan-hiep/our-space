import dynamic from "next/dynamic";
import type {
	IndividualExpense,
	MemoryMapEntry,
	Movie,
	Profile,
	SharedNote,
} from "@/lib/types";

const NoteDialog = dynamic(
	() => import("@/components/notes/note-dialog").then((mod) => mod.NoteDialog),
	{ ssr: false },
);

const ExpenseDialog = dynamic(
	() =>
		import("@/components/expenses/expense-dialog").then(
			(mod) => mod.ExpenseDialog,
		),
	{ ssr: false },
);

const ProfileDialog = dynamic(
	() =>
		import("@/components/profile/profile-dialog").then(
			(mod) => mod.ProfileDialog,
		),
	{ ssr: false },
);

const HeroImageDialog = dynamic(
	() =>
		import("@/components/our-space/hero-image-dialog").then(
			(mod) => mod.HeroImageDialog,
		),
	{ ssr: false },
);

const AnniversaryDialog = dynamic(
	() =>
		import("@/components/our-space/anniversary-dialog").then(
			(mod) => mod.AnniversaryDialog,
		),
	{ ssr: false },
);

const MemoryMapDialog = dynamic(
	() =>
		import("@/components/memory/memory-map-dialog").then(
			(mod) => mod.MemoryMapDialog,
		),
	{ ssr: false },
);

const MovieDialog = dynamic(
	() =>
		import("@/components/movies/movie-dialog").then((mod) => mod.MovieDialog),
	{ ssr: false },
);

interface SpaceDialogsProps {
	anniversaryDate: string;
	editingExpense: IndividualExpense | null;
	editingMemory: MemoryMapEntry | null;
	editingMovie: Movie | null;
	editingNote: SharedNote | null;
	expenseOpen: boolean;
	heroImageUrl: string;
	heroOpen: boolean;
	memoryOpen: boolean;
	movieOpen: boolean;
	noteOpen: boolean;
	partner: Profile;
	profile: Profile;
	profileOpen: boolean;
	anniversaryOpen: boolean;
	senderTimeZone: string;
	onCloseAnniversary: () => void;
	onCloseExpense: () => void;
	onCloseHero: () => void;
	onCloseMemory: () => void;
	onCloseMovie: () => void;
	onCloseNote: () => void;
	onCloseProfile: () => void;
	onExpenseSaved: (expense: IndividualExpense) => void;
	onMemorySaved: (memory: MemoryMapEntry) => void;
	onMovieSaved: (movie: Movie) => void;
	onNoteSaved: (note: SharedNote) => void;
}

export function SpaceDialogs({
	anniversaryDate,
	editingExpense,
	editingMemory,
	editingMovie,
	editingNote,
	expenseOpen,
	heroImageUrl,
	heroOpen,
	memoryOpen,
	movieOpen,
	noteOpen,
	partner,
	profile,
	profileOpen,
	anniversaryOpen,
	senderTimeZone,
	onCloseAnniversary,
	onCloseExpense,
	onCloseHero,
	onCloseMemory,
	onCloseMovie,
	onCloseNote,
	onCloseProfile,
	onExpenseSaved,
	onMemorySaved,
	onMovieSaved,
	onNoteSaved,
}: SpaceDialogsProps) {
	return (
		<>
			<NoteDialog
				open={noteOpen}
				onClose={onCloseNote}
				recipient={partner}
				senderTimeZone={senderTimeZone}
				note={editingNote}
				onSaved={onNoteSaved}
			/>
			<ExpenseDialog
				open={expenseOpen}
				onClose={onCloseExpense}
				profile={profile}
				expense={editingExpense}
				onSaved={onExpenseSaved}
			/>
			<MemoryMapDialog
				open={memoryOpen}
				onClose={onCloseMemory}
				memory={editingMemory}
				profile={profile}
				onSaved={onMemorySaved}
			/>
			<MovieDialog
				open={movieOpen}
				onClose={onCloseMovie}
				movie={editingMovie}
				profile={profile}
				onSaved={onMovieSaved}
			/>
			<ProfileDialog
				open={profileOpen}
				onClose={onCloseProfile}
				profile={profile}
			/>
			<HeroImageDialog
				open={heroOpen}
				onClose={onCloseHero}
				currentUrl={heroImageUrl}
			/>
			<AnniversaryDialog
				open={anniversaryOpen}
				onClose={onCloseAnniversary}
				currentDate={anniversaryDate}
			/>
		</>
	);
}
