import dynamic from "next/dynamic";
import {
	CalendarHeart,
	Heart,
	ImageUp,
	LogOut,
	Settings,
	Sparkles,
	UserRound,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { AccentColorPicker } from "@/components/theme/accent-color-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

const NotificationPermissionButton = dynamic(
	() =>
		import("@/components/notifications/notification-permission-button").then(
			(mod) => mod.NotificationPermissionButton,
		),
	{ ssr: false },
);

const fullWidthPersonalActionButtonClass =
	"h-11 w-full rounded-2xl border-accentLight/15 bg-hoverLight/70 px-5 font-bold text-neutral-900 hover:border-accentLight hover:bg-accentContainerLight hover:text-onAccentContainerLight dark:border-neutral-500/40 dark:bg-secondaryDark dark:text-white dark:hover:border-accentDark dark:hover:bg-accentDark dark:hover:text-white dark:[&_svg]:text-current";
const preferenceActionButtonClass =
	"h-11 w-full rounded-2xl border-accentLight/15 bg-hoverLight/70 px-5 font-bold text-neutral-900 hover:border-accentLight hover:bg-accentContainerLight hover:text-onAccentContainerLight dark:border-neutral-500/40 dark:bg-secondaryDark dark:text-white dark:hover:border-accentDark dark:hover:bg-accentDark dark:hover:text-white dark:[&_svg]:text-current";
const personalActionIconClass = "size-[17px]";

interface PersonalPanelProps {
	anniversaryLabel: string;
	partner: Profile;
	partnerAvatar: string;
	pending: boolean;
	profile: Profile;
	profileAvatar: string;
	relationshipStats: {
		countdown: string;
		daysTogether: number;
		nextMonthlyLabel: string;
	};
	onEditAnniversary: () => void;
	onEditHeroImage: () => void;
	onOpenProfile: () => void;
	onSignOut: () => void;
}

export function PersonalPanel({
	anniversaryLabel,
	partner,
	partnerAvatar,
	pending,
	profile,
	profileAvatar,
	relationshipStats,
	onEditAnniversary,
	onEditHeroImage,
	onOpenProfile,
	onSignOut,
}: PersonalPanelProps) {
	return (
		<div className="grid gap-4 sm:gap-5">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500 sm:hidden">
						Your space
					</p>
					<h2 className="font-serif text-3xl leading-tight sm:mt-2 sm:text-5xl">
						Personal
					</h2>
				</div>
				<div className="grid size-11 place-items-center rounded-full bg-accentContainerLight dark:bg-accentContainerDark text-accentLight dark:text-accentDark shadow-md sm:hidden">
					<UserRound size={22} />
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:items-stretch">
				<div className="app-card app-card-interactive content-fade-in p-4 sm:p-5 lg:min-h-[18rem] lg:p-7">
					<div className="flex items-center gap-3 lg:items-start lg:gap-5">
						<div className="grid size-14 place-items-center rounded-full bg-accentContainerLight dark:bg-accentContainerDark text-2xl lg:size-24 lg:text-5xl">
							{profileAvatar}
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Me
							</p>
							<p className="truncate font-serif text-2xl leading-tight text-neutral-950 lg:text-5xl">
								{profile.display_name}
							</p>
							<p className="truncate text-xs text-neutral-500 lg:mt-2 lg:text-sm">
								{profile.country_code} · {profile.currency} ·{" "}
								{profile.time_zone}
							</p>
						</div>
					</div>
					<div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Country</p>
							<p className="mt-1 font-serif text-2xl">{profile.country_code}</p>
						</div>
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Currency</p>
							<p className="mt-1 font-serif text-2xl">{profile.currency}</p>
						</div>
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Timezone</p>
							<p className="mt-1 truncate font-semibold">{profile.time_zone}</p>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						size="lg"
						className={`${fullWidthPersonalActionButtonClass} mt-4 lg:mt-6`}
						onClick={onOpenProfile}
					>
						<Settings size={17} />
						Edit profile
					</Button>
				</div>

				<div className="app-card app-card-interactive content-fade-in p-4 sm:p-5 lg:min-h-[18rem] lg:p-7">
					<div className="flex items-center gap-3 lg:items-start lg:gap-5">
						<div className="grid size-14 place-items-center rounded-full bg-accentContainerLight dark:bg-accentContainerDark text-2xl lg:size-24 lg:text-5xl">
							{partnerAvatar}
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Partner
							</p>
							<p className="truncate font-serif text-2xl leading-tight text-neutral-950 lg:text-4xl">
								{partner.display_name}
							</p>
							<p className="truncate text-xs text-neutral-500">
								{partner.country_code} · {partner.currency} ·{" "}
								{partner.time_zone}
							</p>
						</div>
					</div>
					<div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Country</p>
							<p className="mt-1 font-serif text-2xl">{partner.country_code}</p>
						</div>
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Currency</p>
							<p className="mt-1 font-serif text-2xl">{partner.currency}</p>
						</div>
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Timezone</p>
							<p className="mt-1 truncate font-semibold">{partner.time_zone}</p>
						</div>
					</div>
					<div className="mt-4 rounded-2xl border border-accentLight/10 bg-hoverLight/70 px-4 py-3 text-sm font-semibold text-neutral-600 dark:border-neutral-500/30 dark:bg-secondaryDark dark:text-white lg:mt-6">
						<Heart
							size={16}
							className="mr-2 inline text-accentLight dark:text-accentDark"
						/>
						Connected in Our Space
					</div>
				</div>
			</div>

			<div className="grid gap-4">
				<div className="app-card content-fade-in p-4 sm:p-5 lg:p-7">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Relationship
							</p>
							<p className="mt-1 font-serif text-2xl leading-tight text-neutral-950 lg:text-5xl">
								{relationshipStats.daysTogether} days together
							</p>
							{/* <p className="mt-2 text-sm text-neutral-500">
								Since {anniversaryLabel}
							</p> */}
						</div>
						<div className="grid size-11 shrink-0 place-items-center rounded-full bg-accentContainerLight dark:bg-accentContainerDark text-accentLight dark:text-accentDark">
							<Sparkles size={20} />
						</div>
					</div>
					<div className="mt-5 grid gap-3 grid-cols-2">
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Next</p>
							<p className="mt-1 truncate font-semibold">
								{relationshipStats.countdown}
							</p>
						</div>
						<div className="rounded-2xl border border-accentLight/10 dark:border-accentDark/10 bg-hoverLight/70 dark:bg-hoverDark/55 p-4">
							<p className="text-xs font-bold text-neutral-500">Since</p>
							<p className="mt-1 truncate font-semibold">
								{anniversaryLabel}
							</p>
						</div>
					</div>
				</div>

				<div className="app-card content-fade-in grid gap-4 p-4 sm:p-5 lg:p-7">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-800">
							App actions
						</p>
						<p className="mt-1 font-serif text-2xl leading-tight text-neutral-950 dark:text-white">
							Preferences
						</p>
					</div>
					<div className="grid gap-2">
						<p className="text-xs font-bold text-neutral-500">Theme</p>
						<ThemeToggle />
					</div>
					<div className="grid gap-2">
						<p className="text-xs font-bold text-neutral-500">Accent color</p>
						<AccentColorPicker />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="outline"
							size="lg"
							className={`${preferenceActionButtonClass}`}
							onClick={onEditAnniversary}
						>
							<CalendarHeart className={personalActionIconClass} />
							Anniversary
						</Button>
						<Button
							type="button"
							variant="outline"
							size="lg"
							className={`${preferenceActionButtonClass}`}
							onClick={onEditHeroImage}
						>
							<ImageUp className={personalActionIconClass} />
							Cover photo
						</Button>
					</div>
					<NotificationPermissionButton
						userId={profile.id}
						className={preferenceActionButtonClass}
					/>
					<Button
						type="button"
						disabled={pending}
						variant="destructive"
						size="lg"
						className="h-11 w-full rounded-2xl bg-danger-bg px-5 font-bold text-danger hover:bg-danger hover:text-white dark:border-danger/40 dark:bg-danger/20 dark:text-white dark:hover:bg-danger dark:hover:text-white"
						onClick={onSignOut}
					>
						<LogOut size={16} />
						Logout
					</Button>
				</div>
			</div>

		</div>
	);
}
