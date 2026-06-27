"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import {
	ImageUp,
	LogOut,
	CalendarHeart,
	Menu as MenuIcon,
	NotebookPen,
	Plus,
	Settings,
	WalletCards,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { signOut } from "@/app/actions";
import type { IndividualExpense, Profile, SharedNote } from "@/lib/types";
import { NoteCard } from "@/components/notes/note-card";
import { NotificationPermissionButton } from "@/components/notifications/notification-permission-button";
import {
	type FilterRange,
	getPeriodOptions,
	getRelationshipStats,
	isInPeriod,
} from "@/lib/dashboard-utils";

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

const FinanceCharts = dynamic(
	() =>
		import("@/components/expenses/finance-charts").then(
			(mod) => mod.FinanceCharts,
		),
	{ ssr: false },
);

const ExpenseFeed = dynamic(
	() =>
		import("@/components/expenses/expense-feed").then((mod) => mod.ExpenseFeed),
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

interface DashboardClientProps {
	profile: Profile;
	partner: Profile;
	initialNotes: SharedNote[];
	initialExpenses: IndividualExpense[];
	heroImageUrl: string;
	anniversaryDate: string;
	currentTimeIso: string;
	exchangeRatesBase: string | null;
	exchangeRates: Record<string, number> | null;
	exchangeRateUpdatedAt: string | null;
	exchangeRateSource: string | null;
}

export function DashboardClient({
	profile,
	partner,
	initialNotes,
	initialExpenses,
	heroImageUrl,
	anniversaryDate,
	currentTimeIso,
	exchangeRatesBase,
	exchangeRates,
	exchangeRateUpdatedAt,
	exchangeRateSource,
}: DashboardClientProps) {
	const router = useRouter();
	const { enqueueSnackbar } = useSnackbar();
	const [noteOpen, setNoteOpen] = useState(false);
	const [expenseOpen, setExpenseOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [heroOpen, setHeroOpen] = useState(false);
	const [anniversaryOpen, setAnniversaryOpen] = useState(false);
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(
		null,
	);
	const [activeSection, setActiveSection] = useState<"notes" | "finances">(
		"notes",
	);
	const [filterRange, setFilterRange] = useState<FilterRange>("week");
	const initialClock = useMemo(
		() => new Date(currentTimeIso),
		[currentTimeIso],
	);
	const [clock, setClock] = useState(initialClock);
	const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
	const [editingExpense, setEditingExpense] =
		useState<IndividualExpense | null>(null);
	const [pending, startTransition] = useTransition();
	const profileTimeZone = profile.time_zone;
	const profileAvatar = profile.avatar_url ?? "🙂";
	const partnerAvatar = partner.avatar_url ?? "🙂";
	const relationshipStats = useMemo(
		() => getRelationshipStats(clock, profileTimeZone, anniversaryDate),
		[anniversaryDate, clock, profileTimeZone],
	);
	const anniversaryLabel = useMemo(() => {
		return new Intl.DateTimeFormat("en-SG", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			timeZone: profileTimeZone,
		}).format(new Date(`${anniversaryDate}T00:00:00.000Z`));
	}, [anniversaryDate, profileTimeZone]);

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
		let cleanup: (() => void) | undefined;
		let cancelled = false;
		let cancelScheduledConnect: (() => void) | undefined;

		const connectRealtime = () => {
			import("@/lib/supabase/browser").then(({ createClient }) => {
				if (cancelled) return;

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

				cleanup = () => {
					supabase.removeChannel(channel);
				};
			});
		};

		if ("requestIdleCallback" in window) {
			const idleId = window.requestIdleCallback(connectRealtime, {
				timeout: 3000,
			});
			cancelScheduledConnect = () => window.cancelIdleCallback(idleId);
		} else {
			const timeoutId = globalThis.setTimeout(connectRealtime, 1000);
			cancelScheduledConnect = () => globalThis.clearTimeout(timeoutId);
		}

		return () => {
			cancelled = true;
			cancelScheduledConnect?.();
			cleanup?.();
		};
	}, [router]);

	useEffect(() => {
		const timer = window.setInterval(() => setClock(new Date()), 30000);
		return () => window.clearInterval(timer);
	}, []);

	const periodLabel = filterRange === "week" ? "Week" : "Month";
	const mobileMenuOpen = Boolean(mobileMenuAnchor);
	const handleSignOut = () => {
		startTransition(async () => {
			enqueueSnackbar("Logged out successfully!", {
				variant: "success",
			});
			await signOut();
		});
	};

	return (
		<main className="min-h-svh overflow-x-clip bg-bg">
			<section className="relative min-h-[50svh] bg-black text-white">
				<Image
					src={heroImageUrl}
					alt="Our Space hero"
					fill
					priority
					quality={88}
					sizes="100vw"
					className="object-cover opacity-75"
				/>
				<div className="container-page relative flex min-h-[50svh] flex-col justify-between py-5 sm:py-7">
					<header className="flex items-center justify-between gap-4 border-b border-paper/25 pb-5 sm:items-start">
						<div className="flex min-w-0 items-start gap-4">
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
						</div>
						<div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
							<div className="flex min-w-0 items-center gap-2 sm:gap-3">
								<div className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-xl shadow-lg backdrop-blur-md">
									{profileAvatar}
								</div>
								<div className="min-w-0 text-right leading-tight sm:text-left">
									<p className="font-serif text-sm font-semibold">
										{profile.display_name}
									</p>
									<p className="text-xs text-paper/70">
										{profile.country_code} · {profile.currency}
									</p>
								</div>
								<button
									type="button"
									aria-label="Open profile menu"
									aria-controls={mobileMenuOpen ? "mobile-nav-menu" : undefined}
									aria-expanded={mobileMenuOpen ? "true" : undefined}
									aria-haspopup="menu"
									onClick={(event) => setMobileMenuAnchor(event.currentTarget)}
									className="grid size-9 shrink-0 place-items-center rounded-full border border-paper/70 bg-black/35 p-0 shadow-lg transition hover:bg-black/50"
								>
									<MenuIcon size={18} />
								</button>
							</div>
							<Menu
								id="mobile-nav-menu"
								anchorEl={mobileMenuAnchor}
								open={mobileMenuOpen}
								onClose={() => setMobileMenuAnchor(null)}
								anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
								transformOrigin={{ vertical: "top", horizontal: "right" }}
							>
								<MenuItem
									onClick={() => {
										setMobileMenuAnchor(null);
										setProfileOpen(true);
									}}
								>
									<Settings
										size={16}
										className="mr-2"
									/>
									Profile
								</MenuItem>
								<MenuItem
									onClick={() => {
										setMobileMenuAnchor(null);
										setHeroOpen(true);
									}}
								>
									<ImageUp
										size={16}
										className="mr-2"
									/>
									Edit image
								</MenuItem>
								<MenuItem
									onClick={() => {
										setMobileMenuAnchor(null);
										setAnniversaryOpen(true);
									}}
								>
									<CalendarHeart
										size={16}
										className="mr-2"
									/>
									Edit anniversary
								</MenuItem>
								<NotificationPermissionButton
									userId={profile.id}
									initialSubscriptionId={profile.onesignal_subscription_id}
									variant="menu-item"
									onDone={() => setMobileMenuAnchor(null)}
								/>
								<MenuItem
									disabled={pending}
									onClick={() => {
										setMobileMenuAnchor(null);
										handleSignOut();
									}}
								>
									<LogOut
										size={16}
										className="mr-2"
									/>
									Logout
								</MenuItem>
							</Menu>
						</div>
					</header>
					<div className="max-w-5xl pt-4 sm:pt-0">
						<p className="eyebrow !text-paper/70">
							A little love in every line.
						</p>
						<h1 className="mt-4 max-w-[10ch] font-serif text-3xl lg:text-7xl leading-[0.95] ">
							A private place for both of us.
						</h1>
						<div className="mt-20 grid max-w-3xl gap-3 grid-cols-2">
							<div className="bg-black/20 p-4 backdrop-blur-sm rounded-lg">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/70">
									Days together
								</p>
								<p className="mt-2 font-serif text-2xl leading-none sm:text-5xl">
									{relationshipStats.daysTogether}
								</p>
								<p className="mt-2 text-sm text-paper/70">
									Since {anniversaryLabel}
								</p>
							</div>
							<div className="bg-black/20 p-4 backdrop-blur-sm rounded-lg">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/70">
									Next anniversary
								</p>
								<p className="mt-2 font-serif text-2xl leading-none sm:text-5xl">
									{relationshipStats.countdown}
								</p>
								<p className="mt-2 text-sm text-paper/70">
									{relationshipStats.nextMonthlyLabel}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="container-page p-5 sm:py-8">
				<div className="-mx-5 border-b border-neutral-200 bg-bg/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
						<ToggleButtonGroup
							exclusive
							value={activeSection}
							onChange={(_, value) => value && setActiveSection(value)}
							size="small"
							className="w-full self-start bg-paper sm:w-auto"
						>
							<ToggleButton
								value="notes"
								className="flex-1 gap-2 px-3 sm:flex-none sm:px-5"
							>
								<NotebookPen size={16} />
								Notes
							</ToggleButton>
							<ToggleButton
								value="finances"
								className="flex-1 gap-2 px-3 sm:flex-none sm:px-5"
							>
								<WalletCards size={16} />
								Finances
							</ToggleButton>
						</ToggleButtonGroup>
						<div className="flex flex-col w-full gap-5 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
							<ToggleButtonGroup
								exclusive
								value={filterRange}
								onChange={(_, value: FilterRange | null) => {
									if (value) {
										setFilterRange(value);
									}
								}}
								size="small"
								className="grid w-full grid-cols-2 bg-paper sm:flex sm:w-auto"
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
								className="w-full rounded-lg bg-paper sm:w-72"
							>
								<InputLabel id="period-select-label">{periodLabel}</InputLabel>
								<Select
									labelId="period-select-label"
									id="period-select"
									name="selected_period"
									value={activePeriod}
									label={periodLabel}
									sx={{
										borderRadius: 1,
										"& .MuiOutlinedInput-notchedOutline": {
											borderRadius: 1,
										},
									}}
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
					<div className="grid gap-5 pt-3">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<h2 className="mt-2 font-serif text-4xl sm:text-5xl">
									Shared notes
								</h2>
							</div>
							<Button
								variant="contained"
								startIcon={<Plus size={17} />}
								className="min-h-11 w-full px-5 text-white hover:bg-neutral-700 sm:w-auto"
								onClick={() => setNoteOpen(true)}
							>
								New note
							</Button>
						</div>
						<div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
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
								<p className="border border-neutral-200 bg-paper p-6 text-neutral-500 md:col-span-3 xl:col-span-4">
									No notes for this {filterRange}.
								</p>
							)}
						</div>
					</div>
				) : (
					<div className="grid gap-5 pt-3">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<h2 className="mt-2 font-serif text-4xl sm:text-5xl">
									Finance overview
								</h2>
							</div>
							<Button
								variant="contained"
								startIcon={<Plus size={17} />}
								className="min-h-11 w-full px-5 text-white hover:bg-neutral-700 sm:w-auto"
								onClick={() => setExpenseOpen(true)}
							>
								Log expense
							</Button>
						</div>
						<FinanceCharts
							expenses={filteredExpenses}
							barExpenses={chartExpenses}
							profiles={coupleProfiles}
							exchangeRatesBase={exchangeRatesBase}
							exchangeRates={exchangeRates}
							exchangeRateUpdatedAt={exchangeRateUpdatedAt}
							exchangeRateSource={exchangeRateSource}
							timeZone={profileTimeZone}
							filterRange={filterRange}
							selectedPeriod={activePeriod}
						/>
						<div className="grid gap-6 xl:grid-cols-2">
							<ExpenseFeed
								title={`My ledger ${profileAvatar}`}
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
								title={`${partner.display_name}'s ledger ${partnerAvatar}`}
								expenses={partnerExpenses}
								currentUserId={profile.id}
								readOnly
								timeZone={profileTimeZone}
							/>
						</div>
					</div>
				)}
			</section>

			{noteOpen ? (
				<NoteDialog
					open={noteOpen}
					onClose={() => {
						setNoteOpen(false);
						setEditingNote(null);
					}}
					recipient={partner}
					senderTimeZone={profileTimeZone}
					note={editingNote}
				/>
			) : null}
			{expenseOpen ? (
				<ExpenseDialog
					open={expenseOpen}
					onClose={() => {
						setExpenseOpen(false);
						setEditingExpense(null);
					}}
					profile={profile}
					expense={editingExpense}
				/>
			) : null}
			{profileOpen ? (
				<ProfileDialog
					open={profileOpen}
					onClose={() => setProfileOpen(false)}
					profile={profile}
				/>
			) : null}
			{heroOpen ? (
				<HeroImageDialog
					open={heroOpen}
					onClose={() => setHeroOpen(false)}
					currentUrl={heroImageUrl}
				/>
			) : null}
			{anniversaryOpen ? (
				<AnniversaryDialog
					open={anniversaryOpen}
					onClose={() => setAnniversaryOpen(false)}
					currentDate={anniversaryDate}
				/>
			) : null}
		</main>
	);
}
