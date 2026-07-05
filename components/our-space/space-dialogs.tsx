import dynamic from "next/dynamic";
import type { IndividualExpense, Profile, SharedNote } from "@/lib/types";

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
	() => import("@/components/profile-dialog").then((mod) => mod.ProfileDialog),
	{ ssr: false },
);

const HeroImageDialog = dynamic(
	() =>
		import("@/components/hero-image-dialog").then((mod) => mod.HeroImageDialog),
	{ ssr: false },
);

const AnniversaryDialog = dynamic(
	() =>
		import("@/components/anniversary-dialog").then(
			(mod) => mod.AnniversaryDialog,
		),
	{ ssr: false },
);

interface SpaceDialogsProps {
	anniversaryDate: string;
	editingExpense: IndividualExpense | null;
	editingNote: SharedNote | null;
	expenseOpen: boolean;
	heroImageUrl: string;
	heroOpen: boolean;
	noteOpen: boolean;
	partner: Profile;
	profile: Profile;
	profileOpen: boolean;
	anniversaryOpen: boolean;
	senderTimeZone: string;
	onCloseAnniversary: () => void;
	onCloseExpense: () => void;
	onCloseHero: () => void;
	onCloseNote: () => void;
	onCloseProfile: () => void;
	onExpenseSaved: (expense: IndividualExpense) => void;
	onNoteSaved: (note: SharedNote) => void;
}

export function SpaceDialogs({
	anniversaryDate,
	editingExpense,
	editingNote,
	expenseOpen,
	heroImageUrl,
	heroOpen,
	noteOpen,
	partner,
	profile,
	profileOpen,
	anniversaryOpen,
	senderTimeZone,
	onCloseAnniversary,
	onCloseExpense,
	onCloseHero,
	onCloseNote,
	onCloseProfile,
	onExpenseSaved,
	onNoteSaved,
}: SpaceDialogsProps) {
	return (
		<>
			{noteOpen ? (
				<NoteDialog
					open={noteOpen}
					onClose={onCloseNote}
					recipient={partner}
					senderTimeZone={senderTimeZone}
					note={editingNote}
					onSaved={onNoteSaved}
				/>
			) : null}
			{expenseOpen ? (
				<ExpenseDialog
					open={expenseOpen}
					onClose={onCloseExpense}
					profile={profile}
					expense={editingExpense}
					onSaved={onExpenseSaved}
				/>
			) : null}
			{profileOpen ? (
				<ProfileDialog
					open={profileOpen}
					onClose={onCloseProfile}
					profile={profile}
				/>
			) : null}
			{heroOpen ? (
				<HeroImageDialog
					open={heroOpen}
					onClose={onCloseHero}
					currentUrl={heroImageUrl}
				/>
			) : null}
			{anniversaryOpen ? (
				<AnniversaryDialog
					open={anniversaryOpen}
					onClose={onCloseAnniversary}
					currentDate={anniversaryDate}
				/>
			) : null}
		</>
	);
}
