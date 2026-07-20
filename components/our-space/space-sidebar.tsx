"use client";

import Image from "next/image";
import {
	CircleDollarSign,
	Clapperboard,
	HeartPulse,
	LogOut,
	MapPinned,
	NotebookPen,
	UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SpaceSection } from "./period-controls";

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
	{
		value: "personal",
		label: "Personal",
		description: "Profiles and settings",
		icon: UserRound,
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
	onSelectSection,
	onSignOut,
}: SpaceSidebarProps) {
	return (
		<aside
			className="
        fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto
        border-r border-sidebar-border
        bg-sidebar/95 p-4
        text-sidebar-foreground
        shadow-[8px_0_40px_rgba(23,23,23,0.08)]
        backdrop-blur-xl

        lg:flex lg:flex-col
      "
		>
			{/* Brand */}
			<div
				className="
          flex items-center gap-3 rounded-3xl
          bg-surface-selected p-3
          text-foreground
        "
			>
				<Image
					src="/icon.svg"
					alt=""
					aria-hidden="true"
					width={36}
					height={36}
					className="size-9 shrink-0"
				/>

				<div className="min-w-0">
					<p className="font-serif text-xl leading-tight text-foreground">
						Our Space 𑣲⋆
					</p>

					<p
						className="
              text-xs font-semibold
              text-muted-foreground
            "
					>
						Since {anniversaryLabel}
					</p>
				</div>
			</div>

			{/* Workspace heading */}
			<div className="mt-5 flex items-center justify-between px-2">
				<p
					className="
            text-[10px] font-bold uppercase tracking-[0.22em]
            text-subtle-foreground
          "
				>
					Workspace
				</p>

				<div
					aria-hidden="true"
					className="
            ml-3 h-px flex-1
            bg-primary-border
          "
				/>
			</div>

			{/* Navigation */}
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
							onClick={() => onSelectSection(item.value)}
							className={[
								`
                  group relative flex min-h-[3.75rem]
                  items-center gap-3 rounded-2xl border px-3
                  text-left
                  transition-[background-color,border-color,color,box-shadow,transform]
                  duration-200
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ring/60
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-surface
                `,
								selected
									? `
                      border-primary
                      bg-surface-selected
                      text-accent-foreground
                      shadow-[0_10px_24px_rgba(23,23,23,0.1)]
                    `
									: `
                      border-transparent
                      text-muted-foreground

                      hover:border-primary-border
                      hover:bg-surface-hover
                      hover:text-foreground
                      hover:shadow-[0_10px_24px_rgba(23,23,23,0.08)]
                    `,
							].join(" ")}
						>
							{/* Navigation icon */}
							<span
								className={[
									`
                    grid size-9 shrink-0 place-items-center
                    rounded-xl
                    transition-[background-color,color,transform]
                    duration-200
                    group-hover:scale-[1.03]
                  `,
									selected
										? `
                        bg-primary
                        text-primary-foreground
                      `
										: `
                        bg-primary-subtle
                        text-primary

                        group-hover:bg-primary-hover
                        group-hover:text-primary-foreground
                      `,
								].join(" ")}
							>
								<Icon
									size={18}
									aria-hidden="true"
								/>
							</span>

							{/* Navigation text */}
							<span className="min-w-0">
								<span className="block text-sm font-bold">{item.label}</span>

								<span
									className={[
										"mt-0.5 block truncate text-xs transition-colors",
										selected
											? `
                          text-accent-foreground/70
                        `
											: `
                          text-subtle-foreground
                          group-hover:text-muted-foreground
                        `,
									].join(" ")}
								>
									{item.description}
								</span>
							</span>
						</button>
					);
				})}
			</nav>

			{/* Relationship statistics */}
			<section
				className="
          mt-5 grid gap-3 rounded-3xl
          border border-primary-border
          bg-surface-selected p-4
          text-accent-foreground
          shadow-[0_18px_44px_rgba(23,23,23,0.12)]
          dark:shadow-[0_18px_44px_rgba(0,0,0,0.24)]
        "
				aria-label="Relationship statistics"
			>
				<div>
					<p
						className="
              text-[10px] font-semibold uppercase
              tracking-[0.2em] opacity-70
            "
					>
						Days together
					</p>

					<p className="mt-1 font-serif text-4xl leading-none">
						{relationshipStats.daysTogether}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-2 text-xs">
					<div
						className="
      rounded-xl
      border border-border
      bg-surface/80 p-3
      text-foreground
    "
					>
						<p className="font-semibold text-foreground">
							Next
						</p>

						<p className="mt-1 text-muted-foreground">
							{relationshipStats.countdown}
						</p>
					</div>

					<div
						className="
      rounded-xl
      border border-border
      bg-surface/80 p-3
      text-foreground
    "
					>
						<p className="font-semibold text-foreground">
							Since
						</p>

						<p className="mt-1 text-muted-foreground">
							{relationshipStats.nextMonthlyLabel}
						</p>
					</div>
				</div>
			</section>

			{/* Actions */}
			<div className="mt-auto pt-5">
				<div className="mb-2 flex items-center justify-between px-2">
					<p
						className="
              text-[10px] font-bold uppercase tracking-[0.22em]
              text-subtle-foreground
            "
					>
						Actions
					</p>

					<div
						aria-hidden="true"
						className="
              ml-3 h-px flex-1
              bg-primary-border
            "
					/>
				</div>

				<div
					className="grid gap-1 rounded-2xl"
				>
					<Button
						type="button"
						variant="destructive"
						disabled={pending}
						onClick={onSignOut}
						className="
              h-10 justify-start rounded-2xl bg-danger-bg
              text-danger
              hover:bg-danger
              hover:text-white
            "
					>
						<LogOut
							size={16}
							aria-hidden="true"
						/>
						{pending ? "Logging out..." : "Logout"}
					</Button>
				</div>
			</div>
		</aside>
	);
}
