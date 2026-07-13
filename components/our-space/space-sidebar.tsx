"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
	CalendarHeart,
	CircleDollarSign,
	Clapperboard,
	HeartPulse,
	ImageUp,
	LogOut,
	MapPinned,
	NotebookPen,
	Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { SpaceSection } from "./period-controls";

const NotificationPermissionButton = dynamic(
	() =>
		import("@/components/notifications/notification-permission-button").then(
			(mod) => mod.NotificationPermissionButton,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-10 items-center gap-2 rounded-2xl px-3">
				<Skeleton className="size-4 rounded-full" />
				<Skeleton className="h-4 flex-1 rounded-full" />
			</div>
		),
	},
);

const navItems: Array<{
	value: SpaceSection;
	label: string;
	description: string;
	icon: typeof NotebookPen;
}> = [
	{
		value: "notes",
		label: "Notes",
		description: "Letters and reminders",
		icon: NotebookPen,
	},
	{
		value: "finances",
		label: "Finance",
		description: "Ledgers and charts",
		icon: CircleDollarSign,
	},
	{
		value: "mood",
		label: "Mood",
		description: "Daily check-ins",
		icon: HeartPulse,
	},
	{
		value: "memories",
		label: "Memory",
		description: "Places and moments",
		icon: MapPinned,
	},
	{
		value: "movies",
		label: "Movies",
		description: "Watchlist and reactions",
		icon: Clapperboard,
	},
];

interface SpaceSidebarProps {
	activeSection: SpaceSection;
	anniversaryLabel: string;
	pending: boolean;
	relationshipStats: {
		countdown: string;
		daysTogether: number;
		nextMonthlyLabel: string;
	};
	userId: string;
	onEditAnniversary: () => void;
	onEditHeroImage: () => void;
	onOpenProfile: () => void;
	onSelectSection: (section: SpaceSection) => void;
	onSignOut: () => void;
}

export function SpaceSidebar({
	activeSection,
	anniversaryLabel,
	pending,
	relationshipStats,
	userId,
	onEditAnniversary,
	onEditHeroImage,
	onOpenProfile,
	onSelectSection,
	onSignOut,
}: SpaceSidebarProps) {
	return (
		<aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-neutral-900/10 bg-paper/95 p-4 shadow-[8px_0_40px_rgba(23,23,23,0.08)] backdrop-blur-xl lg:flex lg:flex-col">
			<div className="flex items-center gap-3 rounded-3xl bg-bg/85 p-3">
				<Image
					src="/icon.svg"
					alt=""
					aria-hidden="true"
					width={36}
					height={36}
					className="size-9 shrink-0"
				/>
				<div className="min-w-0">
					<p className="font-serif text-xl leading-tight">Our Space</p>
					<p className="truncate text-xs font-semibold text-neutral-500">
						Since {anniversaryLabel}
					</p>
				</div>
			</div>

			<div className="mt-5 flex items-center justify-between px-2">
				<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
					Workspace
				</p>
				<div className="h-px flex-1 bg-neutral-900/10 ml-3" />
			</div>

			<nav
				className="mt-2 grid gap-1"
				aria-label="Space sections"
			>
				{navItems.map((item) => {
					const Icon = item.icon;
					const selected = activeSection === item.value;
					return (
						<button
							key={item.value}
							type="button"
							aria-current={selected ? "page" : undefined}
							className={[
								"group relative flex min-h-[3.75rem] items-center gap-3 rounded-2xl px-3 text-left transition",
								selected
									? "bg-neutral-950 text-neutral-50 shadow-[0_10px_24px_rgba(23,23,23,0.18)]"
									: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
							].join(" ")}
							onClick={() => onSelectSection(item.value)}
						>
							<span
								className={[
									"grid size-9 shrink-0 place-items-center rounded-xl transition",
									selected
										? "bg-white/90 dark:bg-black/10 text-black"
										: "bg-neutral-950/5 text-neutral-500 group-hover:bg-neutral-950/8 group-hover:text-neutral-950",
								].join(" ")}
							>
								<Icon size={18} />
							</span>
							<span className="min-w-0">
								<span className="block text-sm font-bold">{item.label}</span>
								<span
									className={[
										"mt-0.5 block truncate text-xs",
										selected ? "text-white/60" : "text-neutral-400",
									].join(" ")}
								>
									{item.description}
								</span>
							</span>
						</button>
					);
				})}
			</nav>

			<div className="mt-5 grid gap-3 rounded-3xl bg-neutral-950 p-4 text-white shadow-[0_18px_44px_rgba(23,23,23,0.2)]">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
						Days together
					</p>
					<p className="mt-1 font-serif text-4xl leading-none">
						{relationshipStats.daysTogether}
					</p>
				</div>
				<div className="grid grid-cols-2 gap-2 text-xs text-white/70">
					<div className="rounded-xl bg-white/10 dark:bg-black/10 p-3">
						<p className="font-semibold text-white dark:text-black">Next</p>
						<p className="mt-1">{relationshipStats.countdown}</p>
					</div>
					<div className="rounded-xl bg-white/10 dark:bg-black/10 p-3">
						<p className="font-semibold text-white dark:text-black">Cycle</p>
						<p className="mt-1 truncate">
							{relationshipStats.nextMonthlyLabel}
						</p>
					</div>
				</div>
			</div>

			<div className="mt-auto pt-5">
				<div className="mb-2 flex items-center justify-between px-2">
					<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
						Actions
					</p>
					<div className="h-px flex-1 bg-neutral-900/10 ml-3" />
				</div>
				<div className="grid gap-1 rounded-3xl border border-neutral-900/10 bg-bg/75 p-2">
					<ThemeToggle />
					<NotificationPermissionButton
						userId={userId}
						variant="menu-item"
					/>
					<Button
						type="button"
						variant="ghost"
						className="h-10 justify-start rounded-2xl"
						onClick={onOpenProfile}
					>
						<Settings size={16} />
						Profile
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-10 justify-start rounded-2xl"
						onClick={onEditHeroImage}
					>
						<ImageUp size={16} />
						Cover photo
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-10 justify-start rounded-2xl"
						onClick={onEditAnniversary}
					>
						<CalendarHeart size={16} />
						Anniversary
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={pending}
						className="h-10 justify-start rounded-2xl"
						onClick={onSignOut}
					>
						<LogOut size={16} />
						Logout
					</Button>
				</div>
			</div>
		</aside>
	);
}
