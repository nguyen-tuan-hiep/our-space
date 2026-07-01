"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
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
	Quote,
	Settings,
	WalletCards,
} from "lucide-react";
import { useToast } from "@/components/toast";
import { loadFinanceDashboardData, signOut } from "@/app/actions";
import type {
	IndividualExpense,
	LoveQuote,
	Profile,
	SharedNote,
} from "@/lib/types";
import { NoteCard } from "@/components/notes/note-card";
import { NotificationPermissionButton } from "@/components/notifications/notification-permission-button";
import { logoutOneSignal } from "@/lib/onesignal-web";
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
	heroImageUrl: string;
	anniversaryDate: string;
	currentTimeIso: string;
	dailyLoveQuote: LoveQuote;
}

export function DashboardClient({
	profile,
	partner,
	initialNotes,
	heroImageUrl,
	anniversaryDate,
	currentTimeIso,
	dailyLoveQuote,
}: DashboardClientProps) {
	const router = useRouter();
	const toast = useToast();
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
	const [notes, setNotes] = useState(initialNotes);
	const [expenses, setExpenses] = useState<IndividualExpense[]>([]);
	const [financeLoaded, setFinanceLoaded] = useState(false);
	const [financeLoading, setFinanceLoading] = useState(false);
	const [financeError, setFinanceError] = useState<string | null>(null);
	const [exchangeRatesBase, setExchangeRatesBase] = useState<string | null>(null);
	const [exchangeRates, setExchangeRates] = useState<Record<
		string,
		number
	> | null>(null);
	const [exchangeRateUpdatedAt, setExchangeRateUpdatedAt] = useState<
		string | null
	>(null);
	const [exchangeRateSource, setExchangeRateSource] = useState<string | null>(
		null,
	);
	const ignoredRealtimeNoteIds = useRef(new Set<string>());
	const ignoredRealtimeExpenseIds = useRef(new Set<string>());
	const financeLoadedRef = useRef(false);
	const financeRequestId = useRef(0);
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
			notes,
			expenses,
			initialClock,
			profileTimeZone,
			filterRange,
		);
	}, [expenses, filterRange, initialClock, notes, profileTimeZone]);

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
			notes.filter((note) =>
				isInPeriod(note.created_at, activePeriod, profileTimeZone, filterRange),
			),
		[activePeriod, filterRange, notes, profileTimeZone],
	);

	const filteredExpenses = useMemo(
		() =>
			expenses.filter((expense) =>
				isInPeriod(
					expense.transaction_date,
					activePeriod,
					profileTimeZone,
					filterRange,
				),
			),
		[activePeriod, expenses, filterRange, profileTimeZone],
	);

	const myExpenses = useMemo(
		() => filteredExpenses.filter((expense) => expense.owner_id === profile.id),
		[filteredExpenses, profile.id],
	);
	const partnerExpenses = useMemo(
		() => filteredExpenses.filter((expense) => expense.owner_id === partner.id),
		[filteredExpenses, partner.id],
	);
	const chartExpenses = filterRange === "week" ? filteredExpenses : expenses;
	const coupleProfiles = useMemo<[Profile, Profile]>(
		() => [profile, partner],
		[profile, partner],
	);

	useEffect(() => {
		setNotes(initialNotes);
	}, [initialNotes]);

	const loadFinanceData = useCallback(async (options?: { silent?: boolean }) => {
		const requestId = financeRequestId.current + 1;
		financeRequestId.current = requestId;

		if (!options?.silent) {
			setFinanceLoading(true);
		}
		setFinanceError(null);

		try {
			const data = await loadFinanceDashboardData();
			if (financeRequestId.current !== requestId) return;

			setExpenses(data.expenses);
			setExchangeRatesBase(data.exchangeRate.ratesBase);
			setExchangeRates(data.exchangeRate.rates);
			setExchangeRateUpdatedAt(data.exchangeRate.updatedAt);
			setExchangeRateSource(data.exchangeRate.source);
			setFinanceLoaded(true);
			financeLoadedRef.current = true;
		} catch (error) {
			if (financeRequestId.current !== requestId) return;

			const message =
				error instanceof Error
					? error.message
					: "Finance data could not be loaded.";
			setFinanceError(message);
		} finally {
			if (financeRequestId.current === requestId) {
				setFinanceLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		if (activeSection === "finances" && !financeLoaded && !financeLoading) {
			void loadFinanceData();
		}
	}, [activeSection, financeLoaded, financeLoading, loadFinanceData]);

	const upsertLocalNote = (savedNote: SharedNote) => {
		ignoredRealtimeNoteIds.current.add(savedNote.id);
		window.setTimeout(() => {
			ignoredRealtimeNoteIds.current.delete(savedNote.id);
		}, 10000);

		setNotes((currentNotes) => {
			const nextNotes = currentNotes.some((note) => note.id === savedNote.id)
				? currentNotes.map((note) =>
						note.id === savedNote.id ? savedNote : note,
					)
				: [savedNote, ...currentNotes];

			return nextNotes.sort(
				(first, second) =>
					new Date(second.created_at).getTime() -
					new Date(first.created_at).getTime(),
			);
		});
	};

	const upsertLocalExpense = (savedExpense: IndividualExpense) => {
		ignoredRealtimeExpenseIds.current.add(savedExpense.id);
		window.setTimeout(() => {
			ignoredRealtimeExpenseIds.current.delete(savedExpense.id);
		}, 10000);

		setExpenses((currentExpenses) => {
			const nextExpenses = currentExpenses.some(
				(expense) => expense.id === savedExpense.id,
			)
				? currentExpenses.map((expense) =>
						expense.id === savedExpense.id ? savedExpense : expense,
					)
				: [savedExpense, ...currentExpenses];

			return nextExpenses.sort(
				(first, second) =>
					new Date(second.transaction_date).getTime() -
					new Date(first.transaction_date).getTime(),
			);
		});
	};

	const getRealtimeRecordId = (
		record: Record<string, unknown> | null | undefined,
	) => {
		return typeof record?.id === "string" ? record.id : null;
	};

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
						(payload) => {
							const noteId =
								getRealtimeRecordId(payload.new) ??
								getRealtimeRecordId(payload.old);

							if (noteId && ignoredRealtimeNoteIds.current.has(noteId)) return;
							router.refresh();
						},
					)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "individual_expenses" },
						(payload) => {
							const expenseId =
								getRealtimeRecordId(payload.new) ??
								getRealtimeRecordId(payload.old);

							if (
								expenseId &&
								ignoredRealtimeExpenseIds.current.has(expenseId)
							) {
								return;
							}

							if (financeLoadedRef.current) {
								void loadFinanceData({ silent: true });
							}
						},
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
	}, [loadFinanceData, router]);

	useEffect(() => {
		const timer = window.setInterval(() => setClock(new Date()), 30000);
		return () => window.clearInterval(timer);
	}, []);

	const periodLabel = filterRange === "week" ? "Week" : "Month";
	const mobileMenuOpen = Boolean(mobileMenuAnchor);
	const handleSignOut = () => {
		startTransition(async () => {
			try {
				await logoutOneSignal();
			} catch (error) {
				console.warn("OneSignal logout failed", error);
			}

			toast("Logged out successfully!", {
				variant: "success",
			});
			await signOut();
		});
	};

	return (
		<main className="min-h-svh overflow-x-clip bg-bg">
			<section className="relative min-h-[50svh] sm:min-h-[70svh] bg-black text-white">
				<Image
					src={heroImageUrl}
					alt="Our Space hero"
					fill
					priority
					quality={88}
					sizes="100vw"
					className="object-cover opacity-75"
				/>
				<div className="container-page relative flex min-h-[50svh] sm:min-h-[70svh] flex-col py-5 sm:py-7">
					<header className="flex items-center justify-between gap-4 border-b border-paper/25 pb-1">
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

					<div className="flex-1 flex flex-col justify-between">
						<div className="">
							<p className="eyebrow !text-paper/70">Love in every line.</p>
							{/* <h1 className="mt-4 max-w-[10ch] font-serif text-3xl lg:text-5xl leading-[0.95] ">
								A private place for both of us.
							</h1> */}
						</div>

						<div className="">
							<h1 className="max-w-[10ch] font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-1 mb-2 sm:mb-6">
								A private place for us.
							</h1>
							<div className="grid max-w-3xl gap-3 grid-cols-2">
								<div className="bg-black/20 p-4 backdrop-blur-sm rounded-lg">
									<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/70">
										Days together
									</p>
									<p className="mt-2 font-serif text-2xl sm:text-4xl md:text-5xl">
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
									<p className="mt-2 font-serif text-2xl sm:text-4xl md:text-5xl">
										{relationshipStats.countdown}
									</p>
									<p className="mt-2 text-sm text-paper/70">
										{relationshipStats.nextMonthlyLabel}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="container-page py-5 sm:py-8">
				<div className="flex gap-3 flex-row items-center sm:gap-4">
					<div className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-neutral-700">
						<Quote size={18} className="block"/>
					</div>
					<div className="min-w-0">
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
							Quote of the day
						</p>
						<p className="mt-2 font-serif text-xl leading-snug text-neutral-900 sm:text-2xl">
							"{dailyLoveQuote.text}"
						</p>
						{dailyLoveQuote.author ? (
							<p className="mt-2 text-sm text-neutral-500">
								{dailyLoveQuote.author}
							</p>
						) : null}
					</div>
				</div>
			{/* </section>

			<section className="container-page p-5 pt-0 sm:py-8"> */}
				<hr className="border-t border-neutral-400 my-5" />
				<div className="-mx-5 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
						{/* <hr className="border-t border-neutral-300 my-5" /> */}
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

				<hr className="border-t border-neutral-400 my-5" />
				{activeSection === "notes" ? (
					<div className="grid gap-5">
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
						<div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
					<div className="grid gap-5">
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
								disabled={financeLoading && !financeLoaded}
								onClick={() => setExpenseOpen(true)}
							>
								Log expense
							</Button>
						</div>
						{financeLoading && !financeLoaded ? (
							<p className="border border-neutral-200 bg-paper p-6 text-neutral-500">
								Loading finance data...
							</p>
						) : financeError ? (
							<div className="grid gap-4 border border-neutral-200 bg-paper p-6 text-neutral-600">
								<p>{financeError}</p>
								<Button
									variant="outlined"
									className="w-full sm:w-fit"
									onClick={() => void loadFinanceData()}
								>
									Try again
								</Button>
							</div>
						) : (
							<>
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
							</>
						)}
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
					onSaved={upsertLocalNote}
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
					onSaved={upsertLocalExpense}
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
