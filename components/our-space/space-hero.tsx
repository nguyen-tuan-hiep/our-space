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
    <section className="relative min-h-[36svh] rounded-b-[2rem] bg-neutral-900 text-white shadow-[0_12px_32px_rgb(0_0_0/0.12)] sm:min-h-[50svh] sm:rounded-b-[2.5rem] lg:min-h-[56svh]">
      {/* Only the photo is clipped to the rounded edge, so the profile menu can extend past it. */}
      <div className="absolute inset-0 overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem]">
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
      <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="container-page relative flex min-h-[36svh] flex-col pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] sm:min-h-[50svh] sm:py-6 lg:min-h-[56svh]">
        {/* Compact profile cluster over the photo (desktop uses the sidebar instead).
            z-30 keeps the menu above the frosted stat cards painted after it. */}
        <header className="relative z-30 flex justify-end text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-white/22 text-xl shadow-sm backdrop-blur-md">
              {profileAvatar}
            </div>
            <div className="min-w-0 leading-tight drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
              <p className="truncate text-sm font-semibold">
                {profile.display_name}
              </p>
              <p className="text-xs text-white/80">
                {profile.country_code} · {profile.currency}
              </p>
            </div>
            <div className="relative" ref={mobileMenuRef}>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  aria-controls={mobileMenuOpen ? "mobile-nav-menu" : undefined}
                  aria-expanded={mobileMenuOpen ? "true" : undefined}
                  aria-haspopup="menu"
                  onClick={onToggleMenu}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-white/35 bg-white/12 p-0 backdrop-blur-md transition hover:bg-white/20 active:scale-[0.92]"
                >
                  <MenuIcon size={18} />
                </button>
                {mobileMenuOpen ? (
                  <div
                    id="mobile-nav-menu"
                    role="menu"
                    className="glass-surface mobile-menu-popover-in absolute right-0 top-[3.25rem] z-30 w-64 overflow-hidden rounded-2xl glass-surface-strong py-1 text-foreground"
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
                      className={`${menuItemClass} text-danger hover:bg-danger-bg hover:text-danger`}
                      onClick={onSignOut}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                ) : null}
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-between pt-5 sm:pt-6">
          <div>
          </div>

          <div>
            <h1 className="mb-4 max-w-[12ch] font-serif text-[2rem] leading-none drop-shadow-sm sm:mb-6 sm:max-w-[11ch] sm:text-3xl md:text-5xl hidden sm:block">
              A private place for us.
            </h1>
            <div className="grid max-w-3xl grid-cols-2 gap-3 sm:gap-4">
              <div className="glass-photo-surface rounded-3xl p-3 text-white sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 drop-shadow-sm">
                  Days together
                </p>
                <p className="mt-1 font-serif text-xl drop-shadow-sm sm:mt-2 sm:text-4xl md:text-5xl">
                  {relationshipStats.daysTogether}
                </p>
                <p className="mt-1 text-xs text-white/80 drop-shadow-sm sm:mt-2 sm:text-sm">
                  Since {anniversaryLabel}
                </p>
              </div>
              <div className="glass-photo-surface rounded-3xl p-3 text-white sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 drop-shadow-sm">
                  Next anniversary
                </p>
                <p className="mt-1 font-serif text-xl drop-shadow-sm sm:mt-2 sm:text-4xl md:text-5xl">
                  {relationshipStats.countdown}
                </p>
                <p className="mt-1 text-xs text-white/80 drop-shadow-sm sm:mt-2 sm:text-sm">
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
