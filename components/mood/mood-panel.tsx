"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarDays, HeartPulse, Pencil, Trash2 } from "lucide-react";
import { deleteMood, upsertMood } from "@/app/actions";
import { useToast } from "@/components/feedback/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeButton, NativeTextarea } from "@/components/ui/native-controls";
import { MoodPanelSkeleton } from "@/components/our-space/tab-skeletons";
import type { DailyMood, MoodLevel, Profile } from "@/lib/types";

export const moodOptions: Array<{
	value: MoodLevel;
	label: string;
	emoji: string;
	caption: string;
}> = [
	{ value: "great", label: "Great", emoji: "🤩", caption: "Full of spark" },
	{ value: "excited", label: "Excited", emoji: "😍", caption: "Heart racing" },
	{ value: "happy", label: "Happy", emoji: "😊", caption: "Light & sweet" },
	{ value: "calm", label: "Calm", emoji: "😌", caption: "Soft day" },
	{ value: "okay", label: "Okay", emoji: "🙂", caption: "Steady" },
	{ value: "tired", label: "Tired", emoji: "🥱", caption: "Low battery" },
	{
		value: "stressed",
		label: "Stressed",
		emoji: "😵‍💫",
		caption: "Need a pause",
	},
	{ value: "sad", label: "Sad", emoji: "😔", caption: "Heavy heart" },
];

const moodMap = new Map(moodOptions.map((option) => [option.value, option]));
const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayMs = 24 * 60 * 60 * 1000;

function localDateKey(value: string | Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone,
	}).formatToParts(new Date(value));
	const getPart = (type: string) =>
		parts.find((part) => part.type === type)?.value ?? "";

	return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function formatMoodDate(dateKey: string, timeZone: string) {
	return new Intl.DateTimeFormat("en-SG", {
		weekday: "long",
		day: "2-digit",
		month: "short",
		year: "numeric",
		timeZone,
	}).format(new Date(`${dateKey}T12:00:00.000Z`));
}

function getMoodOption(mood?: MoodLevel | null) {
	return mood ? moodMap.get(mood) : null;
}

function dateKeyFromUtcDate(date: Date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function parseDateKey(dateKey: string) {
	const [year = 1970, month = 1, day = 1] = dateKey.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, amount: number) {
	return new Date(date.getTime() + amount * dayMs);
}

function getPeriodStart(activePeriod: string, filterRange: "week" | "month") {
	if (filterRange === "month") {
		const [year = 1970, month = 1] = activePeriod.split("-").map(Number);
		return new Date(Date.UTC(year, month - 1, 1));
	}

	return parseDateKey(activePeriod);
}

function getMoodCalendarCells(
	activePeriod: string,
	filterRange: "week" | "month",
) {
	const periodStart = getPeriodStart(activePeriod, filterRange);

	if (filterRange === "week") {
		return Array.from({ length: 7 }, (_, index) => {
			const date = addDays(periodStart, index);
			return {
				date,
				dateKey: dateKeyFromUtcDate(date),
				inPeriod: true,
			};
		});
	}

	const mondayOffset = (periodStart.getUTCDay() + 6) % 7;
	const gridStart = addDays(periodStart, -mondayOffset);
	const currentMonth = periodStart.getUTCMonth();

	return Array.from({ length: 42 }, (_, index) => {
		const date = addDays(gridStart, index);
		return {
			date,
			dateKey: dateKeyFromUtcDate(date),
			inPeriod: date.getUTCMonth() === currentMonth,
		};
	});
}

function personMoodCard({
	avatar,
	label,
	mood,
	timeZone,
}: {
	avatar: string;
	label: string;
	mood?: DailyMood;
	timeZone: string;
}) {
	const option = getMoodOption(mood?.mood);

	return (
		<div className="app-card content-fade-in p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-accentContainerLight dark:bg-accentContainerDark text-xl">
						{avatar}
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-bold text-neutral-900">
							{label}
						</p>
						<p className="text-xs font-semibold text-neutral-500">
							{mood
								? formatMoodDate(mood.mood_date, timeZone)
								: "Not logged yet"}
						</p>
					</div>
				</div>
				<div className="text-3xl">{option?.emoji ?? "—"}</div>
			</div>
			<p className="mt-3 text-sm font-semibold text-neutral-700">
				{option ? option.label : "No mood"}
			</p>
			{mood?.note ? (
				<p className="mt-2 rounded-2xl bg-accentContainerLight dark:bg-accentContainerDark px-3 py-2 text-sm leading-6 text-neutral-600">
					{mood.note}
				</p>
			) : null}
		</div>
	);
}

interface MoodPanelProps {
	activePeriod: string;
	currentTimeIso: string;
	currentUserId: string;
	filterRange: "week" | "month";
	loading: boolean;
	moods: DailyMood[];
	partner: Profile;
	partnerAvatar: string;
	periodControl?: ReactNode;
	profile: Profile;
	profileAvatar: string;
	timeZone: string;
	onMoodDeleted: (moodId: string) => void;
	onMoodSaved: (mood: DailyMood) => void;
}

export function MoodPanel({
	activePeriod,
	currentTimeIso,
	currentUserId,
	filterRange,
	loading,
	moods,
	partner,
	partnerAvatar,
	periodControl,
	profile,
	profileAvatar,
	timeZone,
	onMoodDeleted,
	onMoodSaved,
}: MoodPanelProps) {
	const toast = useToast();
	const showInitialSkeleton = loading && moods.length === 0;
	const todayKey = useMemo(
		() => localDateKey(currentTimeIso, timeZone),
		[currentTimeIso, timeZone],
	);
	const calendarCells = useMemo(
		() => getMoodCalendarCells(activePeriod, filterRange),
		[activePeriod, filterRange],
	);
	const defaultSelectedDate = useMemo(() => {
		const todayInPeriod = calendarCells.some(
			(cell) => cell.inPeriod && cell.dateKey === todayKey,
		);

		if (todayInPeriod) return todayKey;
		return calendarCells.find((cell) => cell.inPeriod)?.dateKey ?? todayKey;
	}, [calendarCells, todayKey]);
	const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
	const [mood, setMood] = useState<MoodLevel>("great");
	const [note, setNote] = useState("");
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		setSelectedDate(defaultSelectedDate);
	}, [defaultSelectedDate]);

	const moodsByOwnerDate = useMemo(() => {
		const map = new Map<string, DailyMood>();
		moods.forEach((item) => {
			map.set(`${item.owner_id}:${item.mood_date}`, item);
		});

		return map;
	}, [moods]);

	const selectedMood = useMemo(
		() => moodsByOwnerDate.get(`${currentUserId}:${selectedDate}`),
		[currentUserId, moodsByOwnerDate, selectedDate],
	);
	const partnerSelectedMood = useMemo(
		() => moodsByOwnerDate.get(`${partner.id}:${selectedDate}`),
		[moodsByOwnerDate, partner.id, selectedDate],
	);

	useEffect(() => {
		setMood(selectedMood?.mood ?? "great");
		setNote(selectedMood?.note ?? "");
	}, [selectedMood]);

	if (showInitialSkeleton) {
		return <MoodPanelSkeleton />;
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await upsertMood(formData);
			toast(result.message, { variant: result.ok ? "success" : "error" });
			if (result.ok) onMoodSaved(result.mood);
		});
	};

	const handleDelete = () => {
		if (!selectedMood) return;

		startTransition(async () => {
			const result = await deleteMood(selectedMood.id);
			toast(result.message, { variant: result.ok ? "success" : "error" });
			if (result.ok) onMoodDeleted(selectedMood.id);
		});
	};

	return (
		<div className="grid gap-4 sm:gap-5">
			<div className="flex items-center justify-between gap-4 sm:items-end">
				<div className="min-w-0">
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Mood tracker
					</h2>
					<p className="mt-1 text-sm text-neutral-500">
						A gentle daily check-in for both of you.
					</p>
				</div>
				<div className="sm:hidden">{periodControl}</div>
			</div>

			<div className="app-card content-fade-in p-3 sm:p-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<CalendarDays
								size={18}
								className="text-accentLight dark:text-accentDark"
							/>
							<p className="font-serif text-2xl leading-tight">Mood calendar</p>
						</div>
						<p className="mt-1 text-xs font-semibold text-neutral-500">
							Big icon = you · small badge = partner
						</p>
					</div>
					<span className="rounded-full bg-accentContainerLight dark:bg-accentContainerDark px-3 py-1 text-xs font-bold text-accentLight dark:text-accentDark">
						{filterRange === "week" ? "Week" : "Month"}
					</span>
				</div>

				<div className="mt-4">
					<div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5 lg:gap-2.5">
						{weekDayLabels.map((label) => (
							<div
								key={label}
								className="py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-neutral-400"
							>
								{label}
							</div>
						))}

						{loading ? (
							Array.from({ length: 14 }).map((_, index) => (
								<Skeleton
									key={index}
									className="h-[4.7rem] rounded-2xl sm:min-h-[5.1rem] lg:min-h-[6rem]"
								/>
							))
						) : (
							calendarCells.map((cell) => {
								const mine = moodsByOwnerDate.get(
									`${currentUserId}:${cell.dateKey}`,
								);
								const partnerMood = moodsByOwnerDate.get(
									`${partner.id}:${cell.dateKey}`,
								);
								const mineOption = getMoodOption(mine?.mood);
								const partnerOption = getMoodOption(partnerMood?.mood);
								const selected = selectedDate === cell.dateKey;
								const isToday = todayKey === cell.dateKey;

								return (
									<button
										key={cell.dateKey}
										type="button"
										disabled={!cell.inPeriod}
										aria-pressed={selected}
										aria-label={`Mood for ${formatMoodDate(cell.dateKey, timeZone)}`}
										onClick={() => setSelectedDate(cell.dateKey)}
										className={[
											"relative h-[4.7rem] min-w-0 overflow-hidden rounded-2xl border px-0.5 py-1.5 transition active:scale-[0.8] sm:h-auto sm:min-h-[5.1rem] sm:px-1.5 sm:py-2 lg:min-h-[6rem] lg:px-3 lg:py-3",
											selected
												? "border-accentLight bg-accentLight dark:border-accentDark text-onAccentLight dark:bg-accentDark dark:text-onAccentDark shadow-[0_12px_28px_rgba(30,25,20,0.24)]"
												: "border-accentLight/15 dark:border-accentDark/15 bg-hoverLight/70 dark:bg-hoverDark/55 text-neutral-800 hover:border-accentLight dark:hover:border-accentDark hover:bg-accentContainerLight dark:hover:bg-accentContainerDark",
											!cell.inPeriod && "pointer-events-none opacity-25",
										]
											.filter(Boolean)
											.join(" ")}
									>
										<span
											className={[
												"mx-auto block text-[10px] font-extrabold sm:text-[11px] lg:text-xs",
												selected
													? "text-onAccentLight/80 dark:text-onAccentDark/80"
													: "text-neutral-600",
											].join(" ")}
										>
											{cell.date.getUTCDate()}
										</span>

										<span className="relative mx-auto mt-1 block size-10 sm:size-9 lg:mt-2 lg:size-11">
											<span
												className={[
													"grid size-10 place-items-center rounded-full text-2xl transition",
													selected
														? "bg-secondaryLight dark:bg-secondaryDark text-neutral-950"
														: "bg-secondaryLight dark:bg-secondaryDark text-neutral-700",
													!mineOption && !selected && "text-neutral-300",
												].join(" ")}
											>
												{mineOption?.emoji ?? "♡"}
											</span>
											{partnerOption ? (
												<span className="absolute -bottom-0.5 -right-0.5 grid size-[1.3rem] place-items-center rounded-full border-secondaryLight dark:border-secondaryDark bg-secondaryLight dark:bg-secondaryDark text-[13px] text-neutral-950 shadow-sm sm:size-5 sm:text-[12px] sm:-bottom-0.5 sm:-right-0.5 lg:size-6 lg:text-sm">
													{partnerOption.emoji}
												</span>
											) : null}
										</span>

										{isToday ? (
											<span
												className={[
													"absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
													selected ? "bg-primaryLight" : "bg-accentLight dark:bg-accentDark",
												].join(" ")}
											/>
										) : null}
									</button>
								);
							})
						)}
					</div>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{personMoodCard({
					avatar: profileAvatar,
					label: `${profile.display_name} · You`,
					mood: selectedMood,
					timeZone,
				})}
				{personMoodCard({
					avatar: partnerAvatar,
					label: partner.display_name,
					mood: partnerSelectedMood,
					timeZone,
				})}
			</div>

			<form
				onSubmit={handleSubmit}
				className="app-card content-fade-in p-3 sm:p-5"
			>
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accentContainerLight dark:bg-accentContainerDark text-accentLight dark:text-accentDark">
							<HeartPulse size={24} />
						</div>
						<div className="min-w-0">
							<p className="font-serif text-2xl leading-tight">How are you today?</p>
							<p className="text-sm text-neutral-500">
								{formatMoodDate(selectedDate, timeZone)}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-4 grid gap-4">
					<input
						type="hidden"
						name="mood_date"
						value={selectedDate}
					/>
					<input
						type="hidden"
						name="mood"
						value={mood}
					/>
					<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
						{moodOptions.map((option) => {
							const selected = mood === option.value;
							return (
								<button
									key={option.value}
									type="button"
									aria-pressed={selected}
									onClick={() => setMood(option.value)}
									className={[
										"group grid min-h-[4.8rem] place-items-center rounded-2xl border px-2 py-2 text-center transition active:scale-[0.8]",
										selected
											? "border-accentLight bg-accentLight text-onAccentLight dark:border-accentDark dark:bg-accentDark dark:text-onAccentDark shadow-[0_12px_28px_rgba(30,25,20,0.18)]"
											: "border-accentLight/15 dark:border-accentDark/15 bg-hoverLight/70 dark:bg-hoverDark/55 text-neutral-800 hover:border-accentLight dark:hover:border-accentDark hover:bg-accentContainerLight dark:hover:bg-accentContainerDark hover:text-onAccentContainerLight dark:hover:text-onAccentContainerDark",
									].join(" ")}
								>
									<span className="text-2xl">{option.emoji}</span>
									<span
										className={[
											"text-[11px] font-bold",
											selected
												? "text-onAccentLight/85 dark:text-onAccentDark/85"
												: "text-neutral-700 group-hover:text-onAccentContainerLight/80 dark:group-hover:text-onAccentContainerDark/80",
										].join(" ")}
									>
										{option.label}
									</span>
								</button>
							);
						})}
					</div>

					<NativeTextarea
						label="Small note (optional)"
						name="note"
						rows={3}
						maxLength={500}
						value={note}
						onChange={(event) => setNote(event.target.value)}
					/>

					<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
						{selectedMood ? (
							<NativeButton
								type="button"
								variant="outlined"
								disabled={pending}
								onClick={handleDelete}
								className="!border-transparent !text-danger hover:!bg-danger-bg sm:order-1"
							>
								<Trash2 size={17} />
								Delete mood
							</NativeButton>
						) : null}
						<NativeButton
							type="submit"
							disabled={pending}
							className="sm:order-2"
						>
							<Pencil size={17} />
							{selectedMood ? "Update mood" : "Save mood"}
						</NativeButton>
					</div>
				</div>
			</form>
		</div>
	);
}
