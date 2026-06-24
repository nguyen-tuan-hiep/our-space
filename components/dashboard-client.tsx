"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import {
	ImageUp,
	LogOut,
	NotebookPen,
	Plus,
	Settings,
	WalletCards,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { createClient } from "@/lib/supabase/browser";
import { signOut } from "@/app/actions";
import type { IndividualExpense, Profile, SharedNote } from "@/lib/types";
import { NoteDialog } from "@/components/notes/note-dialog";
import { NoteCard } from "@/components/notes/note-card";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseFeed } from "@/components/expenses/expense-feed";
import { FinanceCharts } from "@/components/expenses/finance-charts";
import { AvatarIcon } from "@/components/avatar-icon";
import { ProfileDialog } from "@/components/profile-dialog";
import { HeroImageDialog } from "@/components/hero-image-dialog";
import { NameWithAvatar } from "@/components/name-with-avatar";
import { locationSettings } from "@/lib/constants";
import {
	type FilterRange,
	getPeriodOptions,
	getRelationshipStats,
	isInPeriod,
} from "@/lib/dashboard-utils";

const heroButtonSx = {
	color: "white",
	borderColor: "rgba(255, 255, 255, 0.95)",
	backgroundColor: "rgba(17, 17, 15, 0.2)",
	backdropFilter: "blur(10px)",
	"&:hover": {
		borderColor: "rgba(255, 255, 255, 1)",
		backgroundColor: "white",
		color: "#11110f",
	},
};

interface DashboardClientProps {
	profile: Profile;
	partner: Profile;
	initialNotes: SharedNote[];
	initialExpenses: IndividualExpense[];
	heroImageUrl: string;
	currentTimeIso: string;
	exchangeRateSgdToVnd: number | null;
	exchangeRateUpdatedAt: string | null;
	exchangeRateSource: string | null;
}

export function DashboardClient({
	profile,
	partner,
	initialNotes,
	initialExpenses,
	heroImageUrl,
	currentTimeIso,
	exchangeRateSgdToVnd,
	exchangeRateUpdatedAt,
	exchangeRateSource,
}: DashboardClientProps) {
	const router = useRouter();
	const { enqueueSnackbar } = useSnackbar();
	const [noteOpen, setNoteOpen] = useState(false);
	const [expenseOpen, setExpenseOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [heroOpen, setHeroOpen] = useState(false);
	const [activeSection, setActiveSection] = useState<"notes" | "financial">(
		"notes",
	);
	const [filterRange, setFilterRange] = useState<FilterRange>("month");
	const initialClock = useMemo(
		() => new Date(currentTimeIso),
		[currentTimeIso],
	);
	const [clock, setClock] = useState(initialClock);
	const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
	const [editingExpense, setEditingExpense] =
		useState<IndividualExpense | null>(null);
	const [pending, startTransition] = useTransition();
	const profileLocation = locationSettings[profile.country_code];
	const profileTimeZone = profileLocation.timeZone;
	const relationshipStats = useMemo(
		() => getRelationshipStats(clock, profileTimeZone),
		[clock, profileTimeZone],
	);

	const periodOptions = useMemo(() => {
		return getPeriodOptions(
			initialNotes,
			initialExpenses,
			initialClock,
			profileTimeZone,
			filterRange,
		);
	}, [
		filterRange,
		initialClock,
		initialExpenses,
		initialNotes,
		profileTimeZone,
	]);

	const [selectedPeriod, setSelectedPeriod] = useState(
		() => periodOptions[0]?.value ?? "",
	);
	const activePeriod = periodOptions.some(
		(option) => option.value === selectedPeriod,
	)
		? selectedPeriod
		: (periodOptions[0]?.value ?? "");

	useEffect(() => {
		if (selectedPeriod !== activePeriod) {
			setSelectedPeriod(activePeriod);
		}
	}, [activePeriod, selectedPeriod]);

	const filteredNotes = useMemo(
		() =>
			initialNotes.filter((note) =>
				isInPeriod(note.created_at, activePeriod, profileTimeZone, filterRange),
			),
		[activePeriod, filterRange, initialNotes, profileTimeZone],
	);

	const filteredExpenses = useMemo(
		() =>
			initialExpenses.filter((expense) =>
				isInPeriod(
					expense.transaction_date,
					activePeriod,
					profileTimeZone,
					filterRange,
				),
			),
		[activePeriod, filterRange, initialExpenses, profileTimeZone],
	);

	const myExpenses = useMemo(
		() => filteredExpenses.filter((expense) => expense.owner_id === profile.id),
		[filteredExpenses, profile.id],
	);
	const partnerExpenses = useMemo(
		() => filteredExpenses.filter((expense) => expense.owner_id === partner.id),
		[filteredExpenses, partner.id],
	);
	const chartExpenses =
		filterRange === "week" ? filteredExpenses : initialExpenses;
	const coupleProfiles = useMemo<[Profile, Profile]>(
		() => [profile, partner],
		[profile, partner],
	);

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("couple-dashboard")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "notes" },
				() => router.refresh(),
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "individual_expenses" },
				() => router.refresh(),
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "profiles" },
				() => router.refresh(),
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "app_settings" },
				() => router.refresh(),
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [router]);

	useEffect(() => {
		const timer = window.setInterval(() => setClock(new Date()), 30000);
		return () => window.clearInterval(timer);
	}, []);

	const periodLabel = filterRange === "week" ? "Week" : "Month";

	return (
		<main className="min-h-svh overflow-x-clip bg-paper text-ink">
			<section className="relative min-h-[58svh] bg-black text-white">
				<Image
					src={heroImageUrl}
					alt="Our Space hero"
					fill
					priority
					className="object-cover opacity-75"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
				<div className="container-page relative flex min-h-[58svh] flex-col justify-between py-5 sm:py-7">
					<header className="flex flex-col gap-4 border-b border-white/25 pb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<Image
								src="/icon.svg"
								alt=""
								aria-hidden="true"
								width={28}
								height={28}
								className="size-7 shrink-0"
							/>
							<p className="font-serif text-2xl tracking-wide sm:text-2xl">
								Our Space 𑣲⋆
							</p>
						</div>
						<div className="flex max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
							<div className="hidden items-center gap-3 sm:flex">
								<AvatarIcon
									value={profile.avatar_url}
									label={profile.display_name}
								/>
								<div className="leading-tight">
									<p className="text-sm font-semibold">
										{profile.display_name}
									</p>
									<p className="text-xs text-white/65">
										{profileLocation.flag} {profileLocation.currency}
									</p>
								</div>
							</div>
							<Button
								variant="outlined"
								startIcon={<Settings size={16} />}
								sx={heroButtonSx}
								className="min-h-10 w-full px-3 sm:w-auto sm:px-4"
								onClick={() => setProfileOpen(true)}
							>
								Profile
							</Button>
							<Button
								variant="outlined"
								startIcon={<LogOut size={16} />}
								disabled={pending}
								sx={heroButtonSx}
								className="min-h-10 w-full px-3 sm:w-auto sm:px-4"
								onClick={() =>
									startTransition(async () => {
										enqueueSnackbar("Logged out successfully!", {
											variant: "success",
										});
										await signOut();
									})
								}
							>
								Logout
							</Button>
						</div>
					</header>
					<div className="max-w-5xl pb-8 pt-4 sm:pt-0">
						<p className="eyebrow !text-white/70">
							A little love in every line.
						</p>
						<h1 className="mt-4 max-w-[10ch] font-serif text-5xl leading-[0.95] sm:text-5xl lg:text-7xl">
							A private place for both of us.
						</h1>
						<div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
							<div className="border border-white/25 bg-black/20 p-4 backdrop-blur-sm">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
									Days together
								</p>
								<p className="mt-2 font-serif text-3xl leading-none sm:text-5xl">
									{relationshipStats.daysTogether}
								</p>
								<p className="mt-2 text-sm text-white/70">Since 16 Oct 2025</p>
							</div>
							<div className="border border-white/25 bg-black/20 p-4 backdrop-blur-sm">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
									Next monthly anniversary
								</p>
								<p className="mt-2 font-serif text-3xl leading-none sm:text-5xl">
									{relationshipStats.countdown}
								</p>
								<p className="mt-2 text-sm text-white/70">
									{relationshipStats.nextMonthlyLabel}
								</p>
							</div>
						</div>
						<div className="pt-8 sm:hidden">
							<Button
								variant="outlined"
								startIcon={<ImageUp size={16} />}
								sx={heroButtonSx}
								className="w-fit max-w-full"
								onClick={() => setHeroOpen(true)}
							>
								Edit image
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="container-page py-6 sm:py-8">
				<div className="sticky top-0 z-20 -mx-5 border-b border-neutral-200 bg-paper/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
						<ToggleButtonGroup
							exclusive
							value={activeSection}
							onChange={(_, value) => value && setActiveSection(value)}
							size="small"
							className="w-full self-start bg-white sm:w-auto"
						>
							<ToggleButton
								value="notes"
								className="flex-1 gap-2 px-3 sm:flex-none sm:px-5"
							>
								<NotebookPen size={16} />
								Notes
							</ToggleButton>
							<ToggleButton
								value="financial"
								className="flex-1 gap-2 px-3 sm:flex-none sm:px-5"
							>
								<WalletCards size={16} />
								Financial
							</ToggleButton>
						</ToggleButtonGroup>
						<div className="flex flex-col w-full gap-6 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
							<ToggleButtonGroup
								exclusive
								value={filterRange}
								onChange={(_, value: FilterRange | null) => {
									if (value) {
										setFilterRange(value);
									}
								}}
								size="small"
								className="grid w-full grid-cols-2 bg-white sm:flex sm:w-auto"
							>
								<ToggleButton
									value="week"
									className="min-w-0 w-full px-4"
								>
									Week
								</ToggleButton>
								<ToggleButton
									value="month"
									className="min-w-0 w-full px-4"
								>
									Month
								</ToggleButton>
							</ToggleButtonGroup>
							<FormControl
								size="small"
								className="w-full bg-white sm:w-72"
							>
								<InputLabel id="period-select-label">
									{periodLabel}
								</InputLabel>

								<Select
									labelId="period-select-label"
									id="period-select"
									name="selected_period"
									value={activePeriod}
									label={periodLabel}
									onChange={(event) => setSelectedPeriod(event.target.value)}
								>
									{periodOptions.map((option) => (
										<MenuItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</div>
					</div>
				</div>

				{activeSection === "notes" ? (
					<div className="grid gap-6 py-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="eyebrow">Shared notes</p>
								<h2 className="mt-2 font-serif text-4xl sm:text-5xl">
									For each other
								</h2>
							</div>
							<Button
								variant="contained"
								startIcon={<Plus size={17} />}
								className="min-h-11 w-full bg-ink px-5 text-white hover:bg-neutral-700 sm:w-auto"
								onClick={() => setNoteOpen(true)}
							>
								New note
							</Button>
						</div>
						<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
							{filteredNotes.length ? (
								filteredNotes.map((note) => (
									<NoteCard
										key={note.id}
										note={note}
										currentUserId={profile.id}
										initialNowMs={initialClock.getTime()}
										timeZone={profileTimeZone}
										onEdit={(selectedNote) => {
											setEditingNote(selectedNote);
											setNoteOpen(true);
										}}
									/>
								))
							) : (
								<p className="border border-neutral-200 bg-white p-6 text-neutral-500 md:col-span-2 xl:col-span-3">
									No notes for this {filterRange}.
								</p>
							)}
						</div>
					</div>
				) : (
					<div className="grid gap-6 py-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="eyebrow">Financial</p>
								<h2 className="mt-2 font-serif text-4xl sm:text-5xl">
									{filterRange === "week"
										? "Weekly ledgers"
										: "Monthly ledgers"}
								</h2>
							</div>
							<Button
								variant="contained"
								startIcon={<Plus size={17} />}
								className="min-h-11 w-full bg-ink px-5 text-white hover:bg-neutral-700 sm:w-auto"
								onClick={() => setExpenseOpen(true)}
							>
								Log expense
							</Button>
						</div>
						<FinanceCharts
							expenses={filteredExpenses}
							barExpenses={chartExpenses}
							profiles={coupleProfiles}
							exchangeRateSgdToVnd={exchangeRateSgdToVnd}
							exchangeRateUpdatedAt={exchangeRateUpdatedAt}
							exchangeRateSource={exchangeRateSource}
							timeZone={profileTimeZone}
							filterRange={filterRange}
							selectedPeriod={activePeriod}
						/>
						<div className="grid gap-6 xl:grid-cols-2">
							<ExpenseFeed
								title="My ledger"
								titleAvatarValue={profile.avatar_url}
								expenses={myExpenses}
								currentUserId={profile.id}
								readOnly={false}
								timeZone={profileTimeZone}
								onEdit={(expense) => {
									setEditingExpense(expense);
									setExpenseOpen(true);
								}}
							/>
							<ExpenseFeed
								title={`${partner.display_name}'s ledger`}
								titleAvatarValue={partner.avatar_url}
								expenses={partnerExpenses}
								currentUserId={profile.id}
								readOnly
								timeZone={profileTimeZone}
							/>
						</div>
					</div>
				)}
			</section>

			<NoteDialog
				open={noteOpen}
				onClose={() => {
					setNoteOpen(false);
					setEditingNote(null);
				}}
				recipient={partner}
				note={editingNote}
			/>
			<ExpenseDialog
				open={expenseOpen}
				onClose={() => {
					setExpenseOpen(false);
					setEditingExpense(null);
				}}
				profile={profile}
				expense={editingExpense}
			/>
			<ProfileDialog
				open={profileOpen}
				onClose={() => setProfileOpen(false)}
				profile={profile}
			/>
			<HeroImageDialog
				open={heroOpen}
				onClose={() => setHeroOpen(false)}
				currentUrl={heroImageUrl}
			/>
		</main>
	);
}
