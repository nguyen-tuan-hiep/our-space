"use client";

import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { useToast } from "@/components/toast";
import { loadFinanceDashboardData, signOut } from "@/app/actions";
import type {
	IndividualExpense,
	LoveQuote,
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
import { FinancesPanel } from "@/components/our-space/finances-panel";
import { LoveQuotePanel } from "@/components/our-space/love-quote-panel";
import { NotesPanel } from "@/components/our-space/notes-panel";
import { PeriodControls } from "@/components/our-space/period-controls";
import {
	addUtcMonths,
	getCalendarDays,
	getUtcDateKey,
	getUtcMonthStart,
} from "@/components/our-space/period-utils";
import { SpaceDialogs } from "@/components/our-space/space-dialogs";
import { SpaceHero } from "@/components/our-space/space-hero";

interface OurSpaceClientProps {
	profile: Profile;
	partner: Profile;
	initialNotes: SharedNote[];
	heroImageUrl: string;
	anniversaryDate: string;
	currentTimeIso: string;
	dailyLoveQuote: LoveQuote;
}

type SpacePayload = {
	notes: SharedNote[];
	heroImageUrl: string;
	anniversaryDate: string;
};

type CachedSpacePayload = SpacePayload & {
	profileId: string;
	cachedAt: string;
};

type SpaceSection = "notes" | "finances";

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

function getRealtimeRecordId(record: Record<string, unknown> | null | undefined) {
	return typeof record?.id === "string" ? record.id : null;
}

export function OurSpaceClient({
	profile,
	partner,
	initialNotes,
	heroImageUrl: initialHeroImageUrl,
	anniversaryDate: initialAnniversaryDate,
	currentTimeIso,
	dailyLoveQuote: initialDailyLoveQuote,
}: OurSpaceClientProps) {
	const router = useRouter();
	const toast = useToast();
	const [noteOpen, setNoteOpen] = useState(false);
	const [expenseOpen, setExpenseOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [heroOpen, setHeroOpen] = useState(false);
	const [anniversaryOpen, setAnniversaryOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
	const [activeSection, setActiveSection] = useState<SpaceSection>("notes");
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
	const [dailyLoveQuote] = useState(initialDailyLoveQuote);
	const [spaceLoading, setSpaceLoading] = useState(initialNotes.length === 0);
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
	const periodPickerRef = useRef<HTMLDivElement | null>(null);
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

	const [selectedPeriod, setSelectedPeriod] = useState(() =>
		getPeriodKey(initialClock, profileTimeZone, "week"),
	);
	const [pickerMonth, setPickerMonth] = useState(() =>
		getUtcMonthStart(initialClock),
	);
	const activePeriod = selectedPeriod;

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

	const applySpacePayload = useCallback(
		(payload: SpacePayload, options?: { cache?: boolean }) => {
			setNotes(payload.notes);
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
			if (!options?.silent) setSpaceLoading(true);

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
				setSpaceLoading(false);
			}
		},
		[applySpacePayload],
	);

	useEffect(() => {
		const cached = readCachedSpacePayload(profile.id);
		if (cached) {
			applySpacePayload(cached, { cache: false });
			setSpaceLoading(false);
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
						{ event: "*", schema: "public", table: "profiles" },
						() => router.refresh(),
					)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "app_settings" },
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

			if (periodPickerOpen && !periodPickerRef.current?.contains(target)) {
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
	const calendarDays = useMemo(() => getCalendarDays(pickerMonth), [pickerMonth]);
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

	const handleFilterRangeChange = (range: FilterRange) => {
		setFilterRange(range);
		setSelectedPeriod(getPeriodKey(initialClock, profileTimeZone, range));
		setPickerMonth(getUtcMonthStart(initialClock));
	};

	const movePicker = (direction: "next" | "previous") => {
		const amount = direction === "next" ? 1 : -1;
		setPickerMonth((current) =>
			addUtcMonths(current, filterRange === "month" ? amount * 12 : amount),
		);
	};

	const selectWeekFromDate = (date: Date) => {
		setFilterRange("week");
		setSelectedPeriod(getPeriodKey(date, profileTimeZone, "week"));
		setPickerMonth(getUtcMonthStart(date));
		setPeriodPickerOpen(false);
	};

	const selectMonth = (monthIndex: number) => {
		const date = new Date(Date.UTC(visibleYear, monthIndex, 1));
		setFilterRange("month");
		setSelectedPeriod(getPeriodKey(date, profileTimeZone, "month"));
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

	return (
		<main className="min-h-svh overflow-x-clip bg-bg">
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

			<section className="container-page py-5 sm:py-8">
				<LoveQuotePanel quote={dailyLoveQuote} />

				<hr className="mb-4 mt-5 border-t border-neutral-400" />

				<PeriodControls
					activeSection={activeSection}
					activePeriod={activePeriod}
					calendarDays={calendarDays}
					calendarMonthTitle={calendarMonthTitle}
					filterRange={filterRange}
					periodDescription={periodDescription}
					periodLabel={periodLabel}
					periodPickerOpen={periodPickerOpen}
					periodPickerRef={periodPickerRef}
					profileTimeZone={profileTimeZone}
					todayKey={todayKey}
					visibleYear={visibleYear}
					onFilterRangeChange={handleFilterRangeChange}
					onMovePicker={movePicker}
					onSelectMonth={selectMonth}
					onSelectSection={setActiveSection}
					onSelectWeekFromDate={selectWeekFromDate}
					onTogglePeriodPicker={() => setPeriodPickerOpen((open) => !open)}
				/>

				<hr className="my-5 border-t border-neutral-400" />

				{activeSection === "notes" ? (
					<NotesPanel
						currentUserId={profile.id}
						filterRange={filterRange}
						initialNowMs={initialClock.getTime()}
						loading={spaceLoading}
						notes={displayNotes}
						timeZone={profileTimeZone}
						onEditNote={(selectedNote) => {
							setEditingNote(selectedNote);
							setNoteOpen(true);
						}}
						onNewNote={() => setNoteOpen(true)}
					/>
				) : (
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
						onEditExpense={(expense) => {
							setEditingExpense(expense);
							setExpenseOpen(true);
						}}
						onLoadFinanceData={() => void loadFinanceData()}
						onLogExpense={() => setExpenseOpen(true)}
					/>
				)}
			</section>

			<SpaceDialogs
				anniversaryDate={anniversaryDate}
				editingExpense={editingExpense}
				editingNote={editingNote}
				expenseOpen={expenseOpen}
				heroImageUrl={heroImageUrl}
				heroOpen={heroOpen}
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
				onCloseNote={() => {
					setNoteOpen(false);
					setEditingNote(null);
				}}
				onCloseProfile={() => setProfileOpen(false)}
				onExpenseSaved={upsertLocalExpense}
				onNoteSaved={upsertLocalNote}
			/>
		</main>
	);
}
