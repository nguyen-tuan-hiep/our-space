import { PanelHeader } from "@/components/common/panel-header";
import dynamic from "next/dynamic";
import {
	Bell,
	CalendarHeart,
	Heart,
	ImageUp,
	LogOut,
	Palette,
	Settings,
	Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Profile } from "@/lib/types";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AnimatedNumber } from "@/components/common/animated-number";
import { Button } from "@/components/ui/button";

const NotificationPermissionButton = dynamic(
	() =>
		import("@/components/notifications/notification-permission-button").then(
			(mod) => mod.NotificationPermissionButton,
		),
	{ ssr: false },
);

const fullWidthPersonalActionButtonClass =
	"h-11 w-full rounded-2xl border-primary-border bg-surface px-5 font-bold text-foreground hover:border-primary hover:bg-primary-container-hover hover:text-accent-foreground";
const preferenceActionButtonClass =
	"h-10 w-full rounded-full px-4 font-semibold sm:w-auto sm:min-w-32";

/** One settings row: icon + copy on the left, its control on the right (stacked on mobile). */
function PreferenceRow({ icon, title, description, children }: {
	icon: ReactNode;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
			<div className="flex min-w-0 items-center gap-3">
				<span aria-hidden="true" className="glass-chip grid size-10 shrink-0 place-items-center rounded-full text-foreground">
					{icon}
				</span>
				<div className="min-w-0">
					<p className="text-sm font-semibold text-foreground">{title}</p>
					<p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
				</div>
			</div>
			<div className="shrink-0 sm:flex sm:justify-end">{children}</div>
		</div>
	);
}

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
			<PanelHeader title="Personal" description="Your profiles, your preferences, and the little details that make this space yours." />

			<div className="grid gap-4 md:grid-cols-2 lg:items-stretch">
				<div className="app-card app-card-interactive content-fade-in p-4 sm:p-5 lg:min-h-[18rem] lg:p-7">
					<div className="flex items-center gap-3 lg:items-start lg:gap-5">
						<div className="grid size-14 place-items-center rounded-full bg-primary-subtle text-accent-foreground shadow-sm lg:size-24 lg:text-5xl">
							{profileAvatar}
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle-foreground">
								Me
							</p>
							<p className="truncate font-serif text-2xl leading-tight text-foreground lg:text-5xl">
								{profile.display_name}
							</p>
							<p className="truncate text-xs text-subtle-foreground lg:mt-2 lg:text-sm">
								{profile.country_code} · {profile.currency} ·{" "}
								{profile.time_zone}
							</p>
						</div>
					</div>
					<div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">
								Country
							</p>
							<p className="mt-1 font-serif text-2xl">{profile.country_code}</p>
						</div>
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">
								Currency
							</p>
							<p className="mt-1 font-serif text-2xl">{profile.currency}</p>
						</div>
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">
								Timezone
							</p>
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
						<div className="grid size-14 place-items-center rounded-full bg-primary-subtle text-accent-foreground shadow-sm lg:size-24 lg:text-5xl">
							{partnerAvatar}
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle-foreground">
								Partner
							</p>
							<p className="truncate font-serif text-2xl leading-tight text-foreground lg:text-4xl">
								{partner.display_name}
							</p>
							<p className="truncate text-xs text-subtle-foreground">
								{partner.country_code} · {partner.currency} ·{" "}
								{partner.time_zone}
							</p>
						</div>
					</div>
					<div className="mt-6 hidden grid-cols-3 gap-3 lg:grid">
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">
								Country
							</p>
							<p className="mt-1 font-serif text-2xl">{partner.country_code}</p>
						</div>
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">
								Currency
							</p>
							<p className="mt-1 font-serif text-2xl">{partner.currency}</p>
						</div>
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">
								Timezone
							</p>
							<p className="mt-1 truncate font-semibold">{partner.time_zone}</p>
						</div>
					</div>
					<div className="mt-4 rounded-2xl border border-primary-border bg-primary-subtle px-4 py-3 text-sm font-semibold text-muted-foreground lg:mt-6">
						<Heart
							size={16}
							className="mr-2 inline text-primary-ink"
						/>
						Connected in Our Space
					</div>
				</div>
			</div>

			<div className="grid gap-4">
				<div className="app-card content-fade-in p-4 sm:p-5 lg:p-7">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle-foreground">
								Relationship
							</p>
							<p className="mt-1 font-serif text-2xl leading-tight text-foreground lg:text-5xl">
								<AnimatedNumber fromZero value={relationshipStats.daysTogether} /> days together
							</p>
							{/* <p className="mt-2 text-sm text-subtle-foreground">
								Since {anniversaryLabel}
							</p> */}
						</div>
						<div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary-ink">
							<Sparkles size={20} />
						</div>
					</div>
					<div className="mt-5 grid gap-3 grid-cols-2">
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">Next</p>
							<p className="mt-1 truncate font-semibold">
								{relationshipStats.countdown}
							</p>
						</div>
						<div className="rounded-2xl border border-primary-border bg-primary-subtle p-4">
							<p className="text-xs font-bold text-subtle-foreground">Since</p>
							<p className="mt-1 truncate font-semibold">{anniversaryLabel}</p>
						</div>
					</div>
				</div>

				<div className="app-card content-fade-in p-4 sm:p-5 lg:p-7">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle-foreground">
							App actions
						</p>
						<p className="mt-1 font-serif text-2xl leading-tight text-foreground">
							Preferences
						</p>
					</div>
					<div className="mt-5 divide-y divide-foreground/8">
						<PreferenceRow icon={<Palette size={18} />} title="Appearance" description="Light, dark, or follow your device.">
							<ThemeToggle className="w-full sm:w-[19rem]" />
						</PreferenceRow>
						<PreferenceRow icon={<CalendarHeart size={18} />} title="Anniversary" description={`Counting from ${anniversaryLabel}.`}>
							<Button type="button" variant="outline" size="lg" className={preferenceActionButtonClass} onClick={onEditAnniversary}>
								Edit date
							</Button>
						</PreferenceRow>
						<PreferenceRow icon={<ImageUp size={18} />} title="Cover photo" description="The shared photo at the top of your space.">
							<Button type="button" variant="outline" size="lg" className={preferenceActionButtonClass} onClick={onEditHeroImage}>
								Change photo
							</Button>
						</PreferenceRow>
						<PreferenceRow icon={<Bell size={18} />} title="Notifications" description="Alerts for new notes on this device.">
							<NotificationPermissionButton
								userId={profile.id}
								className={preferenceActionButtonClass}
								loadingClassName="h-10 w-full rounded-full sm:w-52"
								unsupportedFallback={<p className="text-xs font-medium text-muted-foreground">Not supported on this device</p>}
							/>
						</PreferenceRow>
						<PreferenceRow icon={<LogOut size={18} />} title="Logout" description="Sign out of Our Space on this device.">
							<Button
								type="button"
								disabled={pending}
								variant="destructive"
								size="lg"
								className="h-10 w-full rounded-full border border-danger/25 px-4 font-semibold text-danger hover:bg-danger-bg sm:w-auto sm:min-w-32"
								onClick={onSignOut}
							>
								{pending ? "Logging out..." : "Logout"}
							</Button>
						</PreferenceRow>
					</div>
				</div>
			</div>
		</div>
	);
}
