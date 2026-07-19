"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { loadFinanceDashboardData, signOut } from "@/app/actions";
import type {
	DailyMood,
	IndividualExpense,
	LoveQuote,
	MemoryMapEntry,
	Movie,
	Profile,
	SharedNote,
} from "@/lib/types";
import {
	type FilterRange,
	formatPeriodLabel,
	getPeriodKey,
	getRelationshipStats,
	isInPeriod,
} from "@/lib/dashboard-utils";
import { LoveQuotePanel } from "@/components/our-space/love-quote-panel";
import { NotesPanel } from "@/components/our-space/notes-panel";
import {
	MobileSpaceTabs,
	PeriodControls,
	PeriodPickerButton,
	type SpaceSection,
} from "@/components/our-space/period-controls";
import {
	addUtcMonths,
	getCalendarDays,
	getUtcDateKey,
	getUtcMonthStart,
} from "@/components/our-space/period-utils";
import { DraggableFab } from "@/components/our-space/draggable-fab";
import { SpaceSidebar } from "@/components/our-space/space-sidebar";
import { SpaceHero } from "@/components/our-space/space-hero";
import {
	FinancePanelSkeleton,
	MemoryPanelSkeleton,
	MoodPanelSkeleton,
	MoviesPanelSkeleton,
	PersonalPanelSkeleton,
} from "@/components/our-space/tab-skeletons";

const PersonalPanel = dynamic(
	() =>
		import("@/components/our-space/personal-panel").then(
			(mod) => mod.PersonalPanel,
		),
	{
		loading: PersonalPanelSkeleton,
		ssr: false,
	},
);

const MemoryMapPanel = dynamic(
	() =>
		import("@/components/memory/memory-map-panel").then(
			(mod) => mod.MemoryMapPanel,
		),
	{
		loading: MemoryPanelSkeleton,
		ssr: false,
	},
);

const FinancesPanel = dynamic(
	() =>
		import("@/components/our-space/finances-panel").then(
			(mod) => mod.FinancesPanel,
		),
	{
		loading: FinancePanelSkeleton,
		ssr: false,
	},
);

const MoodPanel = dynamic(
	() => import("@/components/mood/mood-panel").then((mod) => mod.MoodPanel),
	{
		loading: MoodPanelSkeleton,
		ssr: false,
	},
);

const MoviesPanel = dynamic(
	() =>
		import("@/components/movies/movies-panel").then((mod) => mod.MoviesPanel),
	{
		loading: MoviesPanelSkeleton,
		ssr: false,
	},
);

const SpaceDialogs = dynamic(
	() =>
		import("@/components/our-space/space-dialogs").then(
			(mod) => mod.SpaceDialogs,
		),
	{ ssr: false },
);

interface OurSpaceClientProps {
	profile: Profile;
	partner: Profile;
	heroImageUrl: string;
	anniversaryDate: string;
	currentTimeIso: string;
	dailyLoveQuote: LoveQuote;
}

type SpacePayload = {
	notes: SharedNote[];
	moods: DailyMood[];
	memories: MemoryMapEntry[];
	movies: Movie[];
	heroImageUrl: string;
	anniversaryDate: string;
};

type CachedSpacePayload = SpacePayload & {
	profileId: string;
	cachedAt: string;
};

const spaceCachePrefix = "our-space:home:";
const legacyDashboardCachePrefix = "our-space:dashboard:";

function getSpaceCacheKey(profileId: string) {
	return `${spaceCachePrefix}${profileId}`;
}

function isSpacePayload(value: unknown): value is SpacePayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Partial<SpacePayload>;

	return (
		Array.isArray(payload.notes) &&
		Array.isArray(payload.moods) &&
		Array.isArray(payload.memories) &&
		Array.isArray(payload.movies) &&
		typeof payload.heroImageUrl === "string" &&
		typeof payload.anniversaryDate === "string"
	);
}

function readCachedSpacePayload(profileId: string) {
	try {
		const cached = window.localStorage.getItem(getSpaceCacheKey(profileId));
		if (!cached) return null;

		const parsed = JSON.parse(cached) as Partial<CachedSpacePayload>;
		if (parsed.profileId !== profileId || !isSpacePayload(parsed)) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

function writeCachedSpacePayload(profileId: string, payload: SpacePayload) {
	try {
		window.localStorage.setItem(
			getSpaceCacheKey(profileId),
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

function clearSpaceCaches() {
	try {
		for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
			const key = window.localStorage.key(index);
			if (
				key?.startsWith(spaceCachePrefix) ||
				key?.startsWith(legacyDashboardCachePrefix)
			) {
				window.localStorage.removeItem(key);
			}
		}
	} catch {
		// Best-effort cleanup only; auth sign-out still happens server-side.
	}
}

function getRealtimeRecordId(
	record: Record<string, unknown> | null | undefined,
) {
	return typeof record?.id === "string" ? record.id : null;
}

export function OurSpaceClient({
	profile,
	partner,
	heroImageUrl: initialHeroImageUrl,
	anniversaryDate: initialAnniversaryDate,
	currentTimeIso,
	dailyLoveQuote: initialDailyLoveQuote,
}: OurSpaceClientProps) {
	const router = useRouter();
	const toast = useToast();
	const [noteOpen, setNoteOpen] = useState(false);
	const [expenseOpen, setExpenseOpen] = useState(false);
	const [memoryOpen, setMemoryOpen] = useState(false);
	const [movieOpen, setMovieOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [heroOpen, setHeroOpen] = useState(false);
	const [anniversaryOpen, setAnniversaryOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
	const [activeSection, setActiveSection] = useState<SpaceSection>("notes");
	const [filterRange, setFilterRange] = useState<FilterRange>("week");
	const [pickerRange, setPickerRange] = useState<FilterRange>("week");
	const initialClock = useMemo(
		() => new Date(currentTimeIso),
		[currentTimeIso],
	);
	const [clock, setClock] = useState(initialClock);
	const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
	const [editingExpense, setEditingExpense] =
		useState<IndividualExpense | null>(null);
	const [editingMemory, setEditingMemory] = useState<MemoryMapEntry | null>(
		null,
	);
	const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
	const [notes, setNotes] = useState<SharedNote[]>([]);
	const [moods, setMoods] = useState<DailyMood[]>([]);
	const [memories, setMemories] = useState<MemoryMapEntry[]>([]);
	const [movies, setMovies] = useState<Movie[]>([]);
	const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl);
	const [anniversaryDate, setAnniversaryDate] = useState(
		initialAnniversaryDate,
	);
	const [dailyLoveQuote] = useState(initialDailyLoveQuote);
	const [spaceDataLoading, setSpaceDataLoading] = useState(true);
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
	const ignoredRealtimeMoodIds = useRef(new Set<string>());
	const ignoredRealtimeMemoryIds = useRef(new Set<string>());
	const ignoredRealtimeMovieIds = useRef(new Set<string>());
	const mobileMenuRef = useRef<HTMLDivElement | null>(null);
	const desktopPeriodPickerRef = useRef<HTMLDivElement | null>(null);
	const tabletPeriodPickerRef = useRef<HTMLDivElement | null>(null);
	const mobilePeriodPickerRef = useRef<HTMLDivElement | null>(null);
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

	const [selectedWeekPeriod, setSelectedWeekPeriod] = useState(() =>
		getPeriodKey(initialClock, profileTimeZone, "week"),
	);
	const [selectedMonthPeriod, setSelectedMonthPeriod] = useState(() =>
		getPeriodKey(initialClock, profileTimeZone, "month"),
	);
	const [pickerMonth, setPickerMonth] = useState(() =>
		getUtcMonthStart(initialClock),
	);
	const activePeriod =
		filterRange === "week" ? selectedWeekPeriod : selectedMonthPeriod;
	const pickerActivePeriod =
		pickerRange === "week" ? selectedWeekPeriod : selectedMonthPeriod;

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
	const filteredMoods = useMemo(
		() =>
			moods.filter((mood) =>
				isInPeriod(
					`${mood.mood_date}T12:00:00.000Z`,
					activePeriod,
					profileTimeZone,
					filterRange,
				),
			),
		[activePeriod, filterRange, moods, profileTimeZone],
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
	const displayMemories = useMemo(
		() =>
			memories.map((memory) => ({
				...memory,
				creator:
					memory.created_by === profile.id
						? {
								id: profile.id,
								display_name: profile.display_name,
								avatar_url: profile.avatar_url,
								currency: profile.currency,
							}
						: memory.created_by === partner.id
							? {
									id: partner.id,
									display_name: partner.display_name,
									avatar_url: partner.avatar_url,
									currency: partner.currency,
								}
							: memory.creator,
			})),
		[memories, partner, profile],
	);
	const displayMovies = useMemo(
		() =>
			movies.map((movie) => ({
				...movie,
				creator:
					movie.created_by === profile.id
						? {
								id: profile.id,
								display_name: profile.display_name,
								avatar_url: profile.avatar_url,
								currency: profile.currency,
							}
						: movie.created_by === partner.id
							? {
									id: partner.id,
									display_name: partner.display_name,
									avatar_url: partner.avatar_url,
									currency: partner.currency,
								}
							: movie.creator,
			})),
		[movies, partner, profile],
	);

	const applySpacePayload = useCallback(
		(payload: SpacePayload, options?: { cache?: boolean }) => {
			setNotes(payload.notes);
			setMoods(payload.moods);
			setMemories(payload.memories);
			setMovies(payload.movies);
			setHeroImageUrl(payload.heroImageUrl);
			setAnniversaryDate(payload.anniversaryDate);

			if (options?.cache !== false) {
				writeCachedSpacePayload(profile.id, payload);
			}
		},
		[profile.id],
	);

	const loadSpaceData = useCallback(
		async (options?: { signal?: AbortSignal; silent?: boolean }) => {
			if (!options?.silent) setSpaceDataLoading(true);

			try {
				const response = await fetch("/api/dashboard", {
					cache: "no-store",
					signal: options?.signal,
				});

				if (!response.ok) {
					throw new Error("Space data could not be loaded.");
				}

				const payload = (await response.json()) as unknown;
				if (!isSpacePayload(payload)) {
					throw new Error("Space data was malformed.");
				}

				applySpacePayload(payload);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}

				console.warn("Space data refresh failed", error);
			} finally {
				setSpaceDataLoading(false);
			}
		},
		[applySpacePayload],
	);

	useEffect(() => {
		const cached = readCachedSpacePayload(profile.id);
		if (cached) {
			applySpacePayload(cached, { cache: false });
			setSpaceDataLoading(false);
		}

		const controller = new AbortController();
		void loadSpaceData({
			signal: controller.signal,
			silent: Boolean(cached),
		});

		return () => controller.abort();
	}, [applySpacePayload, loadSpaceData, profile.id]);

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

	const removeLocalNote = (noteId: string) => {
		ignoredRealtimeNoteIds.current.add(noteId);
		window.setTimeout(() => {
			ignoredRealtimeNoteIds.current.delete(noteId);
		}, 10000);

		setNotes((currentNotes) =>
			currentNotes.filter((note) => note.id !== noteId),
		);
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

	const upsertLocalMood = (savedMood: DailyMood) => {
		ignoredRealtimeMoodIds.current.add(savedMood.id);
		window.setTimeout(() => {
			ignoredRealtimeMoodIds.current.delete(savedMood.id);
		}, 10000);

		setMoods((currentMoods) => {
			const nextMoods = currentMoods.some((mood) => mood.id === savedMood.id)
				? currentMoods.map((mood) =>
						mood.id === savedMood.id ? savedMood : mood,
					)
				: [savedMood, ...currentMoods];

			return nextMoods.sort((first, second) =>
				second.mood_date.localeCompare(first.mood_date),
			);
		});
	};

	const removeLocalMood = (moodId: string) => {
		ignoredRealtimeMoodIds.current.add(moodId);
		window.setTimeout(() => {
			ignoredRealtimeMoodIds.current.delete(moodId);
		}, 10000);

		setMoods((currentMoods) =>
			currentMoods.filter((mood) => mood.id !== moodId),
		);
	};

	const upsertLocalMemory = (savedMemory: MemoryMapEntry) => {
		ignoredRealtimeMemoryIds.current.add(savedMemory.id);
		window.setTimeout(() => {
			ignoredRealtimeMemoryIds.current.delete(savedMemory.id);
		}, 10000);

		setMemories((currentMemories) => {
			const nextMemories = currentMemories.some(
				(memory) => memory.id === savedMemory.id,
			)
				? currentMemories.map((memory) =>
						memory.id === savedMemory.id ? savedMemory : memory,
					)
				: [savedMemory, ...currentMemories];

			return nextMemories.sort(
				(first, second) =>
					new Date(second.visited_at).getTime() -
					new Date(first.visited_at).getTime(),
			);
		});
	};

	const removeLocalMemory = (memoryId: string) => {
		ignoredRealtimeMemoryIds.current.add(memoryId);
		window.setTimeout(() => {
			ignoredRealtimeMemoryIds.current.delete(memoryId);
		}, 10000);

		setMemories((currentMemories) =>
			currentMemories.filter((memory) => memory.id !== memoryId),
		);
	};

	const upsertLocalMovie = (savedMovie: Movie) => {
		ignoredRealtimeMovieIds.current.add(savedMovie.id);
		window.setTimeout(() => {
			ignoredRealtimeMovieIds.current.delete(savedMovie.id);
		}, 10000);

		setMovies((currentMovies) => {
			const nextMovies = currentMovies.some((movie) => movie.id === savedMovie.id)
				? currentMovies.map((movie) =>
						movie.id === savedMovie.id ? savedMovie : movie,
					)
				: [savedMovie, ...currentMovies];

			return nextMovies.sort(
				(first, second) =>
					new Date(second.updated_at).getTime() -
					new Date(first.updated_at).getTime(),
			);
		});
	};

	const removeLocalMovie = (movieId: string) => {
		ignoredRealtimeMovieIds.current.add(movieId);
		window.setTimeout(() => {
			ignoredRealtimeMovieIds.current.delete(movieId);
		}, 10000);

		setMovies((currentMovies) =>
			currentMovies.filter((movie) => movie.id !== movieId),
		);
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
					.channel("couple-space")
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "notes" },
						(payload) => {
							const noteId =
								getRealtimeRecordId(payload.new) ??
								getRealtimeRecordId(payload.old);

							if (noteId && ignoredRealtimeNoteIds.current.has(noteId)) return;
							void loadSpaceData({ silent: true });
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
						{ event: "*", schema: "public", table: "daily_moods" },
						(payload) => {
							const moodId =
								getRealtimeRecordId(payload.new) ??
								getRealtimeRecordId(payload.old);

							if (moodId && ignoredRealtimeMoodIds.current.has(moodId)) return;
							void loadSpaceData({ silent: true });
						},
					)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "memory_map_entries" },
						(payload) => {
							const memoryId =
								getRealtimeRecordId(payload.new) ??
								getRealtimeRecordId(payload.old);

							if (memoryId && ignoredRealtimeMemoryIds.current.has(memoryId)) {
								return;
							}

							void loadSpaceData({ silent: true });
						},
					)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "movies" },
						(payload) => {
							const movieId =
								getRealtimeRecordId(payload.new) ??
								getRealtimeRecordId(payload.old);

							if (movieId && ignoredRealtimeMovieIds.current.has(movieId)) {
								return;
							}

							void loadSpaceData({ silent: true });
						},
					)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "profiles" },
						() => router.refresh(),
					)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "couple" },
						() => void loadSpaceData({ silent: true }),
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
	}, [loadFinanceData, loadSpaceData, router]);

	useEffect(() => {
		const timer = window.setInterval(() => setClock(new Date()), 30000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		if (!mobileMenuOpen && !periodPickerOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;

			if (mobileMenuOpen && !mobileMenuRef.current?.contains(target)) {
				setMobileMenuOpen(false);
			}

			if (
				periodPickerOpen &&
				!desktopPeriodPickerRef.current?.contains(target) &&
				!tabletPeriodPickerRef.current?.contains(target) &&
				!mobilePeriodPickerRef.current?.contains(target)
			) {
				setPeriodPickerOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setMobileMenuOpen(false);
				setPeriodPickerOpen(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [mobileMenuOpen, periodPickerOpen]);

	const periodLabel = filterRange === "week" ? "Weekly" : "Monthly";
	const periodDescription = activePeriod
		? formatPeriodLabel(activePeriod, profileTimeZone, filterRange)
		: "Current period";
	const pagePeriodDescription =
		activeSection === "memories"
			? "All memories"
			: activeSection === "movies"
				? "Couple watchlist"
				: periodDescription;
	const pickerPeriodDescription = pickerActivePeriod
		? formatPeriodLabel(pickerActivePeriod, profileTimeZone, pickerRange)
		: "Current period";
	const calendarDays = useMemo(
		() => getCalendarDays(pickerMonth),
		[pickerMonth],
	);
	const calendarMonthTitle = useMemo(
		() =>
			new Intl.DateTimeFormat("en-SG", {
				month: "long",
				year: "numeric",
				timeZone: "UTC",
			}).format(pickerMonth),
		[pickerMonth],
	);
	const todayKey = useMemo(() => getUtcDateKey(initialClock), [initialClock]);
	const visibleYear = pickerMonth.getUTCFullYear();

	const getPickerMonthForRange = (range: FilterRange) => {
		const period = range === "week" ? selectedWeekPeriod : selectedMonthPeriod;
		const dateKey = range === "week" ? period : `${period}-01`;
		return getUtcMonthStart(new Date(`${dateKey}T00:00:00.000Z`));
	};

	const handleFilterRangeChange = (range: FilterRange) => {
		setPickerRange(range);
		setPickerMonth(getPickerMonthForRange(range));
	};

	const movePicker = (direction: "next" | "previous") => {
		const amount = direction === "next" ? 1 : -1;
		setPickerMonth((current) =>
			addUtcMonths(current, pickerRange === "month" ? amount * 12 : amount),
		);
	};

	const selectWeekFromDate = (date: Date) => {
		const weekPeriod = getPeriodKey(date, profileTimeZone, "week");
		setPickerRange("week");
		setFilterRange("week");
		setSelectedWeekPeriod(weekPeriod);
		setPickerMonth(getUtcMonthStart(date));
		setPeriodPickerOpen(false);
	};

	const selectMonth = (monthIndex: number) => {
		const date = new Date(Date.UTC(visibleYear, monthIndex, 1));
		const monthPeriod = getPeriodKey(date, profileTimeZone, "month");
		setPickerRange("month");
		setFilterRange("month");
		setSelectedMonthPeriod(monthPeriod);
		setPickerMonth(getUtcMonthStart(date));
		setPeriodPickerOpen(false);
	};

	const handleSignOut = () => {
		startTransition(async () => {
			clearSpaceCaches();

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
	const hasOpenDialog =
		noteOpen ||
		expenseOpen ||
		memoryOpen ||
		movieOpen ||
		profileOpen ||
		heroOpen ||
		anniversaryOpen;
	const periodPickerProps = {
		activePeriod: pickerActivePeriod,
		calendarDays,
		calendarMonthTitle,
		filterRange: pickerRange,
		periodDescription,
		periodPickerOpen,
		profileTimeZone,
		selectedPeriodDescription: pickerPeriodDescription,
		todayKey,
		visibleYear,
		onFilterRangeChange: handleFilterRangeChange,
		onMovePicker: movePicker,
		onSelectMonth: selectMonth,
		onSelectWeekFromDate: selectWeekFromDate,
		onTogglePeriodPicker: () =>
			setPeriodPickerOpen((open) => {
				if (!open) {
					setPickerRange(filterRange);
					setPickerMonth(getPickerMonthForRange(filterRange));
				}
				return !open;
			}),
	};
	const mobilePeriodControl = (
		<PeriodPickerButton
			{...periodPickerProps}
			periodLabel={periodLabel}
			periodPickerRef={mobilePeriodPickerRef}
			periodPickerViewport="mobile"
		/>
	);

	return (
		<main className="min-h-svh overflow-x-clip bg-bg mobile-native-shell lg:pl-72">
			<SpaceSidebar
				activeSection={activeSection}
				anniversaryLabel={anniversaryLabel}
				pending={pending}
				relationshipStats={relationshipStats}
				userId={profile.id}
				onEditAnniversary={() => setAnniversaryOpen(true)}
				onEditHeroImage={() => setHeroOpen(true)}
				onOpenProfile={() => setProfileOpen(true)}
				onSelectSection={setActiveSection}
				onSignOut={handleSignOut}
			/>

			<div className="lg:hidden">
				<SpaceHero
					anniversaryLabel={anniversaryLabel}
					heroImageUrl={heroImageUrl}
					mobileMenuOpen={mobileMenuOpen}
					mobileMenuRef={mobileMenuRef}
					pending={pending}
					profile={profile}
					profileAvatar={profileAvatar}
					relationshipStats={relationshipStats}
					onEditAnniversary={() => {
						setMobileMenuOpen(false);
						setAnniversaryOpen(true);
					}}
					onEditHeroImage={() => {
						setMobileMenuOpen(false);
						setHeroOpen(true);
					}}
					onOpenProfile={() => {
						setMobileMenuOpen(false);
						setProfileOpen(true);
					}}
					onCloseMenu={() => setMobileMenuOpen(false)}
					onSignOut={() => {
						setMobileMenuOpen(false);
						handleSignOut();
					}}
					onToggleMenu={() => setMobileMenuOpen((open) => !open)}
				/>
			</div>

			<section className="container-page pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-4 sm:py-8 lg:max-w-none lg:px-8 lg:py-8 xl:px-10">
				<div className="hidden items-start justify-between gap-6 lg:flex">
					<div>
						<p className="text-sm font-semibold text-neutral-500">
							{pagePeriodDescription}
						</p>
						{/* <h1 className="mt-1 font-serif text-4xl leading-none text-neutral-950 xl:text-5xl">
							{activeSection === "notes"
								? "Shared notes"
								: activeSection === "finances"
									? "Finance overview"
							: activeSection === "mood"
										? "Mood tracker"
										: activeSection === "memories"
											? "Memory map"
											: activeSection === "movies"
												? "Movies"
												: "Personal"}
						</h1> */}
					</div>
					{activeSection === "memories" || activeSection === "movies" ? null : (
						<PeriodPickerButton
							{...periodPickerProps}
							periodLabel={periodLabel}
							periodPickerRef={desktopPeriodPickerRef}
							periodPickerViewport="desktop"
						/>
					)}
				</div>

				<div className="lg:mt-6">
					<LoveQuotePanel quote={dailyLoveQuote} />
				</div>

				<div className="mt-4 sm:mt-6 lg:mt-8">
					<PeriodControls
						activeSection={activeSection}
						{...periodPickerProps}
						hidePeriodPicker={
							activeSection === "memories" || activeSection === "movies"
						}
						periodLabel={periodLabel}
						onSelectSection={setActiveSection}
						periodPickerRef={tabletPeriodPickerRef}
						periodPickerViewport="tablet"
					/>
				</div>

				<div
					key={activeSection}
					className="mobile-tab-panel-in mt-4 sm:material-section sm:mt-5 sm:p-5 lg:mt-6 lg:p-6"
				>
					{activeSection === "notes" ? (
						<NotesPanel
							currentUserId={profile.id}
							filterRange={filterRange}
							initialNowMs={initialClock.getTime()}
							loading={spaceDataLoading}
							notes={displayNotes}
							timeZone={profileTimeZone}
							periodControl={mobilePeriodControl}
							onEditNote={(selectedNote) => {
								setEditingNote(selectedNote);
								setNoteOpen(true);
							}}
							onNoteDeleted={removeLocalNote}
							onNewNote={() => setNoteOpen(true)}
						/>
					) : activeSection === "finances" ? (
						<FinancesPanel
							activePeriod={activePeriod}
							barExpenses={chartExpenses}
							coupleProfiles={coupleProfiles}
							currentUserId={profile.id}
							exchangeRateSource={exchangeRateSource}
							exchangeRateUpdatedAt={exchangeRateUpdatedAt}
							exchangeRates={exchangeRates}
							exchangeRatesBase={exchangeRatesBase}
							filterRange={filterRange}
							financeError={financeError}
							financeLoaded={financeLoaded}
							financeLoading={financeLoading}
							filteredExpenses={filteredExpenses}
							myExpenses={myExpenses}
							partnerDisplayName={partner.display_name}
							partnerExpenses={partnerExpenses}
							profileAvatar={profileAvatar}
							partnerAvatar={partnerAvatar}
							timeZone={profileTimeZone}
							periodControl={mobilePeriodControl}
							onEditExpense={(expense) => {
								setEditingExpense(expense);
								setExpenseOpen(true);
							}}
							onLoadFinanceData={() => void loadFinanceData()}
							onLogExpense={() => setExpenseOpen(true)}
						/>
					) : activeSection === "mood" ? (
						<MoodPanel
							activePeriod={activePeriod}
							currentTimeIso={clock.toISOString()}
							currentUserId={profile.id}
							filterRange={filterRange}
							loading={spaceDataLoading}
							moods={filteredMoods}
							partner={partner}
							partnerAvatar={partnerAvatar}
							periodControl={mobilePeriodControl}
							profile={profile}
							profileAvatar={profileAvatar}
							timeZone={profileTimeZone}
							onMoodDeleted={removeLocalMood}
							onMoodSaved={upsertLocalMood}
						/>
					) : activeSection === "memories" ? (
						<MemoryMapPanel
							loading={spaceDataLoading}
							memories={displayMemories}
							timeZone={profileTimeZone}
							onEditMemory={(memory) => {
								setEditingMemory(memory);
								setMemoryOpen(true);
							}}
							onMemoryDeleted={removeLocalMemory}
							onNewMemory={() => setMemoryOpen(true)}
						/>
					) : activeSection === "movies" ? (
						<MoviesPanel
							loading={spaceDataLoading}
							movies={displayMovies}
							onEditMovie={(movie) => {
								setEditingMovie(movie);
								setMovieOpen(true);
							}}
							onMovieDeleted={removeLocalMovie}
							onMovieSaved={upsertLocalMovie}
							onNewMovie={() => setMovieOpen(true)}
						/>
					) : (
						<PersonalPanel
							anniversaryLabel={anniversaryLabel}
							partner={partner}
							partnerAvatar={partnerAvatar}
							pending={pending}
							profile={profile}
							profileAvatar={profileAvatar}
							relationshipStats={relationshipStats}
							onEditAnniversary={() => setAnniversaryOpen(true)}
							onEditHeroImage={() => setHeroOpen(true)}
							onOpenProfile={() => setProfileOpen(true)}
							onSignOut={handleSignOut}
						/>
					)}
				</div>
			</section>

			<MobileSpaceTabs
				activeSection={activeSection}
				onSelectSection={setActiveSection}
			/>

			{!hasOpenDialog &&
			(activeSection === "notes" ||
				activeSection === "finances" ||
				activeSection === "memories" ||
				activeSection === "movies") ? (
				<DraggableFab
					ariaLabel={
						activeSection === "notes"
							? "Create new note"
							: activeSection === "finances"
								? "Log new expense"
								: activeSection === "memories"
									? "Add memory"
									: "Add movie"
					}
					onClick={
						activeSection === "notes"
							? () => setNoteOpen(true)
							: activeSection === "finances"
								? () => setExpenseOpen(true)
								: activeSection === "memories"
									? () => setMemoryOpen(true)
									: () => setMovieOpen(true)
					}
				>
					<Plus size={24} />
				</DraggableFab>
			) : null}

			<SpaceDialogs
				anniversaryDate={anniversaryDate}
				editingExpense={editingExpense}
				editingMemory={editingMemory}
				editingMovie={editingMovie}
				editingNote={editingNote}
				expenseOpen={expenseOpen}
				heroImageUrl={heroImageUrl}
				heroOpen={heroOpen}
				memoryOpen={memoryOpen}
				movieOpen={movieOpen}
				noteOpen={noteOpen}
				partner={partner}
				profile={profile}
				profileOpen={profileOpen}
				anniversaryOpen={anniversaryOpen}
				senderTimeZone={profileTimeZone}
				onCloseAnniversary={() => setAnniversaryOpen(false)}
				onCloseExpense={() => {
					setExpenseOpen(false);
					setEditingExpense(null);
				}}
				onCloseHero={() => setHeroOpen(false)}
				onCloseMemory={() => {
					setMemoryOpen(false);
					setEditingMemory(null);
				}}
				onCloseMovie={() => {
					setMovieOpen(false);
					setEditingMovie(null);
				}}
				onCloseNote={() => {
					setNoteOpen(false);
					setEditingNote(null);
				}}
				onCloseProfile={() => setProfileOpen(false)}
				onExpenseSaved={upsertLocalExpense}
				onMemorySaved={upsertLocalMemory}
				onMovieSaved={upsertLocalMovie}
				onNoteSaved={upsertLocalNote}
			/>
		</main>
	);
}
