import dynamic from "next/dynamic";
import Image from "next/image";
import type { RefObject } from "react";
import {
	Bell,
	CalendarHeart,
	ImageUp,
	LogOut,
	Menu as MenuIcon,
	Settings,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { menuItemClass } from "./shared-classes";

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

interface SpaceHeroProps {
	anniversaryLabel: string;
	heroImageUrl: string;
	mobileMenuOpen: boolean;
	mobileMenuRef: RefObject<HTMLDivElement | null>;
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
	onCloseMenu: () => void;
	onSignOut: () => void;
	onToggleMenu: () => void;
}

export function SpaceHero({
	anniversaryLabel,
	heroImageUrl,
	mobileMenuOpen,
	mobileMenuRef,
	pending,
	profile,
	profileAvatar,
	relationshipStats,
	onEditAnniversary,
	onEditHeroImage,
	onOpenProfile,
	onCloseMenu,
	onSignOut,
	onToggleMenu,
}: SpaceHeroProps) {
	return (
		<section className="relative min-h-[50svh] bg-black text-white sm:min-h-[70svh]">
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
			<div className="container-page relative flex min-h-[50svh] flex-col py-5 sm:min-h-[70svh] sm:py-7">
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
									aria-controls={mobileMenuOpen ? "mobile-nav-menu" : undefined}
									aria-expanded={mobileMenuOpen ? "true" : undefined}
									aria-haspopup="menu"
									onClick={onToggleMenu}
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
											onClick={onOpenProfile}
										>
											<Settings size={16} />
											Profile
										</button>
										<button
											type="button"
											role="menuitem"
											className={menuItemClass}
											onClick={onEditHeroImage}
										>
											<ImageUp size={16} />
											Edit image
										</button>
										<button
											type="button"
											role="menuitem"
											className={menuItemClass}
											onClick={onEditAnniversary}
										>
											<CalendarHeart size={16} />
											Edit anniversary
										</button>
										<NotificationPermissionButton
											userId={profile.id}
											variant="menu-item"
											onDone={onCloseMenu}
										/>
										<button
											type="button"
											role="menuitem"
											disabled={pending}
											className={menuItemClass}
											onClick={onSignOut}
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

				<div className="flex flex-1 flex-col justify-between">
					<div>
						<p className="eyebrow !text-paper/70">Love in every line.</p>
					</div>

					<div>
						<h1 className="mb-2 max-w-[10ch] font-serif text-3xl leading-1 sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
							A private place for us.
						</h1>
						<div className="grid max-w-3xl grid-cols-2 gap-3">
							<div className="rounded-lg bg-black/20 p-4 backdrop-blur-sm">
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
							<div className="rounded-lg bg-black/20 p-4 backdrop-blur-sm">
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
	);
}
