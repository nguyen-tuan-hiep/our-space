import dynamic from "next/dynamic";
import Image from "next/image";
import type { RefObject } from "react";
import {
	CalendarHeart,
	ImageUp,
	LogOut,
	Menu as MenuIcon,
	Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
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
			<div className="flex items-center gap-2 px-4 py-2.5">
				<Skeleton className="size-4 rounded-full" />
				<Skeleton className="h-4 flex-1 rounded-full" />
			</div>
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
		<section className="relative min-h-[36svh] overflow-hidden rounded-b-[2rem] bg-accentLight text-onAccentLight dark:bg-accentDark dark:text-onAccentDark shadow-[0_18px_44px_rgba(29,27,32,0.24)] sm:min-h-[50svh] sm:rounded-b-[2.5rem] lg:min-h-[56svh]">
			<Image
				src={heroImageUrl}
				alt="Our Space hero"
				fill
				priority
				fetchPriority="high"
				quality={50}
				sizes="100vw"
				className="mobile-hero-media-in object-cover opacity-82"
			/>
			<div className="absolute inset-0 bg-gradient-to-b from-primaryDark/55 via-primaryDark/20 to-primaryDark/60" />
			<div className="absolute inset-0 bg-gradient-to-r from-primaryDark/50 via-transparent to-primaryDark/20" />
			<div className="container-page relative flex min-h-[36svh] flex-col pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] sm:min-h-[50svh] sm:py-6 lg:min-h-[56svh]">
				<header className=" items-center justify-between gap-3 rounded-2xl bg-black/28 px-3 py-2 text-white sm:flex sm:gap-4 sm:px-4">
					<div className="flex min-w-0 items-start gap-4">
						<div className="flex items-center gap-2 hidden sm:flex">
							<Image
								src="/icon.svg"
								alt=""
								aria-hidden="true"
								width={28}
								height={28}
								className="size-7 shrink-0"
							/>
							<p className="font-serif text-xl tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-2xl">
								Our Space 𑣲⋆
							</p>
						</div>
					</div>
					<div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 hidden sm:flex">
						<div className="flex min-w-0 items-center gap-2 sm:gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-full bg-primaryLight/22 text-lg shadow-sm backdrop-blur-md sm:size-10 sm:text-xl">
								{profileAvatar}
							</div>
							<div className="hidden min-w-0 text-right leading-tight sm:block sm:text-left">
								<p className="font-serif text-sm font-semibold">
									{profile.display_name}
								</p>
								<p className="text-xs text-secondaryLight/75">
									{profile.country_code} · {profile.currency}
								</p>
							</div>
							<div
								className="relative hidden sm:block"
								ref={mobileMenuRef}
							>
								<button
									type="button"
									aria-label="Open profile menu"
									aria-controls={mobileMenuOpen ? "mobile-nav-menu" : undefined}
									aria-expanded={mobileMenuOpen ? "true" : undefined}
									aria-haspopup="menu"
									onClick={onToggleMenu}
									className="grid size-10 shrink-0 place-items-center rounded-full border border-primaryLight/35 bg-primaryLight/12 p-0 transition hover:bg-primaryLight/20 active:scale-[0.92] sm:size-9"
								>
									<MenuIcon size={18} />
								</button>
								{mobileMenuOpen ? (
									<div
										id="mobile-nav-menu"
										role="menu"
									className="mobile-menu-popover-in absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-2xl border border-secondaryLight/70 bg-secondaryLight py-1 text-neutral-900 shadow-[0_20px_50px_rgba(29,27,32,0.22)] dark:border-accentDark/16 dark:bg-secondaryDark dark:text-white sm:top-11"
								>
									<div className="px-2 py-2">
										<ThemeToggle onSelect={onCloseMenu} />
									</div>
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
											className={`${menuItemClass} border border-danger/30 bg-danger-bg text-danger hover:bg-danger hover:text-white dark:border-danger/40 dark:bg-danger/20 dark:text-white dark:hover:bg-danger dark:hover:text-white`}
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

				<div className="flex flex-1 flex-col justify-between pt-5 sm:pt-6">
					<div>
						<p className="eyebrow hidden !text-secondaryLight/75 sm:block">
							Love in every line.
						</p>
					</div>

					<div>
						<h1 className="mb-4 max-w-[12ch] font-serif text-[2rem] leading-none drop-shadow-sm sm:mb-6 sm:max-w-[11ch] sm:text-3xl md:text-5xl hidden sm:block">
							A private place for us.
						</h1>
						<div className="grid max-w-3xl grid-cols-2 gap-3 sm:gap-4">
							<div className="mobile-hero-card-in rounded-3xl bg-primaryDark/55 p-3 text-secondaryLight shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-4">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondaryLight/80 drop-shadow-sm">
									Days together
								</p>
								<p className="mt-1 font-serif text-xl drop-shadow-sm sm:mt-2 sm:text-4xl md:text-5xl">
									{relationshipStats.daysTogether}
								</p>
								<p className="mt-1 text-xs text-secondaryLight/80 drop-shadow-sm sm:mt-2 sm:text-sm">
									Since {anniversaryLabel}
								</p>
							</div>
							<div className="mobile-hero-card-in rounded-3xl bg-primaryDark/55 p-3 text-secondaryLight shadow-[0_12px_34px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-4">
								<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondaryLight/80 drop-shadow-sm">
									Next anniversary
								</p>
								<p className="mt-1 font-serif text-xl drop-shadow-sm sm:mt-2 sm:text-4xl md:text-5xl">
									{relationshipStats.countdown}
								</p>
								<p className="mt-1 text-xs text-secondaryLight/80 drop-shadow-sm sm:mt-2 sm:text-sm">
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
