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
import { outlineButtonClass, primaryButtonClass } from "./shared-classes";

const NotificationPermissionButton = dynamic(
	() =>
		import("@/components/notifications/notification-permission-button").then(
			(mod) => mod.NotificationPermissionButton,
		),
	{ ssr: false },
);

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
				<div className="grid size-11 place-items-center rounded-full bg-paper text-mui shadow-md ring-1 ring-neutral-200/70 sm:hidden">
					<UserRound size={22} />
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
				<div className="rounded-[1.75rem] border border-neutral-200 bg-paper p-4 shadow-md rounded-2xl sm:p-5">
					<div className="flex items-center gap-3">
						<div className="grid size-14 place-items-center rounded-full bg-mui/10 text-2xl">
							{profileAvatar}
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Me
							</p>
							<p className="truncate font-serif text-2xl leading-tight text-neutral-950">
								{profile.display_name}
							</p>
							<p className="truncate text-xs text-neutral-500">
								{profile.country_code} · {profile.currency} ·{" "}
								{profile.time_zone}
							</p>
						</div>
					</div>
					<button
						type="button"
						className={`${outlineButtonClass} mt-4 w-full flex items-center justify-center gap-2 rounded-2xl sm:w-fit sm:rounded-md`}
						onClick={onOpenProfile}
					>
						<Settings size={17} />
						Edit profile
					</button>
				</div>

				<div className="rounded-[1.75rem] border border-neutral-200 bg-paper p-4 shadow-md rounded-2xl sm:p-5">
					<div className="flex items-center gap-3">
						<div className="grid size-14 place-items-center rounded-full bg-mui/10 text-2xl">
							{partnerAvatar}
						</div>
						<div className="min-w-0">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Partner
							</p>
							<p className="truncate font-serif text-2xl leading-tight text-neutral-950">
								{partner.display_name}
							</p>
							<p className="truncate text-xs text-neutral-500">
								{partner.country_code} · {partner.currency} ·{" "}
								{partner.time_zone}
							</p>
						</div>
					</div>
					<div className="mt-4 rounded-2xl bg-mui/10 px-4 py-3 text-sm font-semibold text-neutral-600">
						<Heart
							size={16}
							className="mr-2 inline text-mui"
						/>
						Connected in Our Space
					</div>
				</div>
			</div>

			<div className="rounded-[1.75rem] border border-neutral-200 bg-paper p-4 shadow-md rounded-2xl sm:p-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
							Relationship
						</p>
						<p className="mt-1 font-serif text-2xl leading-tight text-neutral-950">
							{relationshipStats.daysTogether} days together
						</p>
						{/* <p className="mt-1 text-sm text-neutral-500">
							Since {anniversaryLabel}. Next: {relationshipStats.countdown} · {relationshipStats.nextMonthlyLabel}
						</p> */}
					</div>
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-mui/10 text-mui">
						<Sparkles size={20} />
					</div>
				</div>
				<div className="mt-4 grid grid-cols-2 gap-3">
					<button
						type="button"
						className={`${outlineButtonClass} w-full flex items-center justify-center gap-2 rounded-2xl sm:w-fit sm:rounded-md`}
						onClick={onEditAnniversary}
					>
						<CalendarHeart size={17} />
						Anniversary
					</button>
					<button
						type="button"
						className={`${outlineButtonClass} w-full flex items-center justify-center gap-2 rounded-2xl sm:w-fit sm:rounded-md`}
						onClick={onEditHeroImage}
					>
						<ImageUp size={17} />
						Cover photo
					</button>
				</div>
			</div>

			<div className="grid gap-3 rounded-[1.75rem] border border-neutral-200 bg-paper p-4 shadow-md rounded-2xl sm:p-5">
				<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
					App actions
				</p>
				<div className="grid gap-3 sm:flex sm:flex-wrap">
					<NotificationPermissionButton userId={profile.id} />
					<button
						type="button"
						disabled={pending}
						className={`${primaryButtonClass} min-h-12 rounded-2xl bg-danger hover:brightness-95 sm:min-h-11 sm:rounded-md`}
						onClick={onSignOut}
					>
						<LogOut size={16} />
						Logout
					</button>
				</div>
			</div>
		</div>
	);
}
