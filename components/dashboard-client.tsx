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
import {
	ImageUp,
	Bell,
	LogOut,
	CalendarHeart,
	Menu as MenuIcon,
	NotebookPen,
	Plus,
	Quote,
	Settings,
	WalletCards,
} from "lucide-react";
import { NativeSelect } from "./ui/native-controls";
import { useToast } from "@/components/toast";
import { loadFinanceDashboardData, signOut } from "@/app/actions";
import type {
	IndividualExpense,
	LoveQuote,
	Profile,
	SharedNote,
} from "@/lib/types";
import { NoteCard } from "@/components/notes/note-card";
import {
	type FilterRange,
	getPeriodOptions,
	getRelationshipStats,
	isInPeriod,
} from "@/lib/dashboard-utils";

const menuItemClass =
	"flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
	"inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-bold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50";
const outlineButtonClass =
	"inline-flex min-h-10 items-center justify-center rounded-md border border-mui px-5 text-sm font-bold text-mui transition hover:bg-mui/10";

function segmentButtonClass(active: boolean) {
	return [
		"relative inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 border px-3 text-sm font-bold transition sm:flex-none sm:px-5",
		active
			? "z-10 border-mui bg-mui/10 text-mui"
			: "z-0 border-neutral-300 bg-paper text-neutral-700",
	].join(" ");
}

const NotificationPermissionButton = dynamic(
  () =>
    import("@/components/notifications/notification-permission-button").then(
      (mod) => mod.NotificationPermissionButton,
    ),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        role="menuitem"
        disabled
        className={menuItemClass}
      >
        <Bell size={16} />
        Checking notifications
      </button>
    ),
  },
);

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

type DashboardPayload = {
	notes: SharedNote[];
	heroImageUrl: string;
	anniversaryDate: string;
};

type CachedDashboardPayload = DashboardPayload & {
	profileId: string;
	cachedAt: string;
};

const dashboardCachePrefix = "our-space:dashboard:";

function getDashboardCacheKey(profileId: string) {
	return `${dashboardCachePrefix}${profileId}`;
}

function isDashboardPayload(value: unknown): value is DashboardPayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Partial<DashboardPayload>;

	return (
		Array.isArray(payload.notes) &&
		typeof payload.heroImageUrl === "string" &&
		typeof payload.anniversaryDate === "string"
	);
}

function readCachedDashboardPayload(profileId: string) {
	try {
		const cached = window.localStorage.getItem(getDashboardCacheKey(profileId));
		if (!cached) return null;

		const parsed = JSON.parse(cached) as Partial<CachedDashboardPayload>;
		if (parsed.profileId !== profileId || !isDashboardPayload(parsed)) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

function writeCachedDashboardPayload(
	profileId: string,
	payload: DashboardPayload,
) {
	try {
		window.localStorage.setItem(
			getDashboardCacheKey(profileId),
			JSON.stringify({
				...payload,
				profileId,
				cachedAt: new Date().toISOString(),
			}),
		);
	} catch {
		// Storage can be unavailable in private browsing or low-space conditions.
	}
}

function clearDashboardCaches() {
	try {
		for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
			const key = window.localStorage.key(index);
			if (key?.startsWith(dashboardCachePrefix)) {
				window.localStorage.removeItem(key);
			}
		}
	} catch {
		// Best-effort cleanup only; auth sign-out still happens server-side.
	}
}

export function DashboardClient({
	profile,
	partner,
	initialNotes,
	heroImageUrl: initialHeroImageUrl,
	anniversaryDate: initialAnniversaryDate,
	currentTimeIso,
	dailyLoveQuote: initialDailyLoveQuote,
}: DashboardClientProps) {
	const router = useRouter();
	const toast = useToast();
	const [noteOpen, setNoteOpen] = useState(false);
	const [expenseOpen, setExpenseOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [heroOpen, setHeroOpen] = useState(false);
	const [anniversaryOpen, setAnniversaryOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
	const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl);
	const [anniversaryDate, setAnniversaryDate] = useState(
		initialAnniversaryDate,
	);
	const [dailyLoveQuote, setDailyLoveQuote] = useState(initialDailyLoveQuote);
	const [dashboardLoading, setDashboardLoading] = useState(
		initialNotes.length === 0,
	);
	const [expenses, setExpenses] = useState<IndividualExpense[]>([]);
	const [financeLoaded, setFinanceLoaded] = useState(false);
	const [financeLoading, setFinanceLoading] = useState(false);
	const [financeError, setFinanceError] = useState<string | null>(null);
	const [exchangeRatesBase, setExchangeRatesBase] = useState<string | null>(
		null,
	);
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
	const mobileMenuRef = useRef<HTMLDivElement | null>(null);
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
	const displayNotes = useMemo(
		() =>
			filteredNotes.map((note) => ({
				...note,
				author:
					note.author_id === profile.id
						? {
								id: profile.id,
								display_name: profile.display_name,
								avatar_url: profile.avatar_url,
								currency: profile.currency,
							}
						: note.author_id === partner.id
							? {
									id: partner.id,
									display_name: partner.display_name,
									avatar_url: partner.avatar_url,
									currency: partner.currency,
								}
							: note.author,
				recipient:
					note.recipient_id === profile.id
						? {
								id: profile.id,
								display_name: profile.display_name,
								avatar_url: profile.avatar_url,
								currency: profile.currency,
							}
						: note.recipient_id === partner.id
							? {
									id: partner.id,
									display_name: partner.display_name,
									avatar_url: partner.avatar_url,
									currency: partner.currency,
								}
							: note.recipient,
			})),
		[filteredNotes, partner, profile],
	);

	const applyDashboardPayload = useCallback(
		(payload: DashboardPayload, options?: { cache?: boolean }) => {
			setNotes(payload.notes);
			setHeroImageUrl(payload.heroImageUrl);
			setAnniversaryDate(payload.anniversaryDate);

			if (options?.cache !== false) {
				writeCachedDashboardPayload(profile.id, payload);
			}
		},
		[profile.id],
	);

	const loadDashboardData = useCallback(
		async (options?: { signal?: AbortSignal; silent?: boolean }) => {
			if (!options?.silent) setDashboardLoading(true);

			try {
				const response = await fetch("/api/dashboard", {
					cache: "no-store",
					signal: options?.signal,
				});

				if (!response.ok) {
					throw new Error("Dashboard data could not be loaded.");
				}

				const payload = (await response.json()) as unknown;
				if (!isDashboardPayload(payload)) {
					throw new Error("Dashboard data was malformed.");
				}

				applyDashboardPayload(payload);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}

				console.warn("Dashboard data refresh failed", error);
			} finally {
				setDashboardLoading(false);
			}
		},
		[applyDashboardPayload],
	);

	useEffect(() => {
		const cached = readCachedDashboardPayload(profile.id);
		if (cached) {
			applyDashboardPayload(cached, { cache: false });
			setDashboardLoading(false);
		}

		const controller = new AbortController();
		void loadDashboardData({
			signal: controller.signal,
			silent: Boolean(cached),
		});

		return () => controller.abort();
	}, [applyDashboardPayload, loadDashboardData, profile.id]);

	const loadFinanceData = useCallback(
		async (options?: { silent?: boolean }) => {
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
		},
		[],
	);

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
							void loadDashboardData({ silent: true });
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
						() => void loadDashboardData({ silent: true }),
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
	}, [loadDashboardData, loadFinanceData, router]);

	useEffect(() => {
		const timer = window.setInterval(() => setClock(new Date()), 30000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		if (!mobileMenuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && !mobileMenuRef.current?.contains(target)) {
				setMobileMenuOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMobileMenuOpen(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [mobileMenuOpen]);

	const periodLabel = filterRange === "week" ? "Week" : "Month";
	const handleSignOut = () => {
		startTransition(async () => {
			clearDashboardCaches();

			try {
				const { logoutOneSignal } = await import("@/lib/onesignal-web");
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
					fetchPriority="high"
					quality={50}
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
								<div className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-xl backdrop-blur-md">
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
								<div
									className="relative"
									ref={mobileMenuRef}
								>
									<button
										type="button"
										aria-label="Open profile menu"
										aria-controls={
											mobileMenuOpen ? "mobile-nav-menu" : undefined
										}
										aria-expanded={mobileMenuOpen ? "true" : undefined}
										aria-haspopup="menu"
										onClick={() => setMobileMenuOpen((open) => !open)}
										className="grid size-9 shrink-0 place-items-center rounded-full border border-paper/70 bg-black/35 p-0 transition hover:bg-black/50"
									>
										<MenuIcon size={18} />
									</button>
									{mobileMenuOpen ? (
										<div
											id="mobile-nav-menu"
											role="menu"
											className="absolute right-0 top-11 z-30 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-neutral-900 shadow-lg"
										>
											<button
												type="button"
												role="menuitem"
												className={menuItemClass}
												onClick={() => {
													setMobileMenuOpen(false);
													setProfileOpen(true);
												}}
											>
												<Settings size={16} />
												Profile
											</button>
											<button
												type="button"
												role="menuitem"
												className={menuItemClass}
												onClick={() => {
													setMobileMenuOpen(false);
													setHeroOpen(true);
												}}
											>
												<ImageUp size={16} />
												Edit image
											</button>
											<button
												type="button"
												role="menuitem"
												className={menuItemClass}
												onClick={() => {
													setMobileMenuOpen(false);
													setAnniversaryOpen(true);
												}}
											>
												<CalendarHeart size={16} />
												Edit anniversary
											</button>
											<NotificationPermissionButton
												userId={profile.id}
												variant="menu-item"
												onDone={() => setMobileMenuOpen(false)}
											/>
											<button
												type="button"
												role="menuitem"
												disabled={pending}
												className={menuItemClass}
												onClick={() => {
													setMobileMenuOpen(false);
													handleSignOut();
												}}
											>
												<LogOut size={16} />
												Logout
											</button>
										</div>
									) : null}
								</div>
							</div>
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
						<Quote
							size={18}
							className="block"
						/>
					</div>
					<div className="min-w-0">
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
							Quote of the day
						</p>
						{dailyLoveQuote.text ? (
							<p className="mt-2 font-serif text-xl leading-snug text-neutral-900 sm:text-2xl">
								"{dailyLoveQuote.text}"
							</p>
						) : (
							<p className="mt-2 font-serif text-xl leading-snug text-neutral-500 sm:text-2xl">
								Quote is unavailable right now.
							</p>
						)}
						{dailyLoveQuote.author ? (
							<p className="mt-2 text-sm text-neutral-500">
								{dailyLoveQuote.author}
							</p>
						) : null}
					</div>
				</div>
				{/* </section>

			<section className="container-page p-5 pt-0 sm:py-8"> */}
				<hr className="border-t border-neutral-400 mt-5 mb-4" />

				<div className="-mx-5 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 pt-2">
					{/* 💡 SỬA TẠI ĐÂY: Chuyển từ flex-col sang flex-row ngay từ mốc `sm` thay vì `md` */}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:gap-6">
						{/* Phần 1: Tabs */}
						<div
							role="tablist"
							aria-label="Dashboard section"
							// {/* 💡 SỬA: sm:w-60 hoặc cứ để sm:w-auto tùy bạn vì chúng đã nằm chung hàng ngang */}
							className="flex w-full rounded-lg bg-paper sm:w-auto h-10 shrink-0"
						>
							<button
								type="button"
								role="tab"
								aria-selected={activeSection === "notes"}
								className={`${segmentButtonClass(activeSection === "notes")} rounded-l-lg`}
								onClick={() => setActiveSection("notes")}
							>
								<NotebookPen size={16} />
								Notes
							</button>
							<button
								type="button"
								role="tab"
								aria-selected={activeSection === "finances"}
								className={`${segmentButtonClass(activeSection === "finances")} rounded-r-lg`}
								onClick={() => setActiveSection("finances")}
							>
								<WalletCards size={16} />
								Finances
							</button>
						</div>

						{/* Phần 2: Filter Range */}
						<div
							role="radiogroup"
							aria-label="Filter range"
							// {/* 💡 SỬA: Đổi md:ml-auto thành sm:ml-auto để chủ động đẩy cụm này và Select về bên phải từ mốc sm */}
							className="grid w-full grid-cols-2 rounded-lg bg-paper sm:flex sm:w-auto sm:ml-auto h-10 shrink-0"
						>
							<button
								type="button"
								role="radio"
								aria-checked={filterRange === "week"}
								className={`${segmentButtonClass(filterRange === "week")} rounded-l-lg`}
								onClick={() => setFilterRange("week")}
							>
								Week
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={filterRange === "month"}
								className={`${segmentButtonClass(filterRange === "month")} rounded-r-lg`}
								onClick={() => setFilterRange("month")}
							>
								Month
							</button>
						</div>

						{/* Phần 3: Select Period */}
						{/* 💡 SỬA: shrink-0 giúp select không bị bóp méo khi màn hình thu nhỏ vừa phải */}
						<div className="relative grid w-full gap-1 rounded-lg sm:w-64 md:w-72 shrink-0">
							<NativeSelect
								id="period-select"
								name="selected_period"
								value={activePeriod}
								label={periodLabel}
								labelBgClass="bg-bg"
								onChange={(event) => setSelectedPeriod(event.target.value)}
							>
								{periodOptions.map((option) => (
									<option
										key={option.value}
										value={option.value}
									>
										{option.label}
									</option>
								))}
							</NativeSelect>
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
							<button
								type="button"
								className={`${primaryButtonClass} w-full sm:w-auto`}
								onClick={() => setNoteOpen(true)}
							>
								<Plus size={17} />
								New note
							</button>
						</div>
						<div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{displayNotes.length ? (
								displayNotes.map((note) => (
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
							) : dashboardLoading ? (
								<div className="border border-neutral-200 bg-paper p-6 text-neutral-500 md:col-span-3 xl:col-span-4">
									Loading notes...
									<div className="mx-auto mt-4 h-1.5 w-44 overflow-hidden rounded-full items-center">
										<div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
									</div>
								</div>
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
							<button
								type="button"
								className={`${primaryButtonClass} w-full sm:w-auto`}
								disabled={financeLoading && !financeLoaded}
								onClick={() => setExpenseOpen(true)}
							>
								<Plus size={17} />
								Log expense
							</button>
						</div>
						{financeLoading && !financeLoaded ? (
							<div className="border border-neutral-200 bg-paper p-6 text-neutral-500 rounded-lg">
								Loading finance data...
								<div className="mx-auto mt-4 h-1.5 w-44 overflow-hidden rounded-full items-center">
									<div className="pwa-loading-bar h-full w-1/2 rounded-full bg-neutral-900" />
								</div>
							</div>
						) : financeError ? (
							<div className="grid gap-4 border border-neutral-200 bg-paper p-6 text-neutral-600">
								<p>{financeError}</p>
								<button
									type="button"
									className={`${outlineButtonClass} w-full sm:w-fit`}
									onClick={() => void loadFinanceData()}
								>
									Try again
								</button>
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
								<div className="grid gap-6 md:grid-cols-2">
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
