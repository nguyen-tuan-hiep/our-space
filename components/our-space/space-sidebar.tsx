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
        glass-navigation fixed inset-y-4 left-4 z-40 hidden w-64 overflow-y-auto rounded-[1.75rem]
        p-3.5
        text-sidebar-foreground

        lg:flex lg:flex-col
      "
		>
			{/* Brand */}
			<div
				className="
          flex items-center gap-3 rounded-2xl
          bg-transparent px-2 py-3
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

			{/* Our everyday heading */}
			<div className="mt-5 flex items-center justify-between px-2">
				<p
					className="
            text-xs font-semibold
            text-subtle-foreground
          "
				>
					Our everyday
				</p>

				<div
					aria-hidden="true"
					className="
            ml-3 h-px flex-1
            bg-foreground/10
          "
				/>
			</div>

			{/* Navigation */}
			<nav
				className="mt-2 grid gap-1.5"
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
                      glass-selected
                    `
									: `
                      border-transparent
                      text-muted-foreground

                      hover:bg-foreground/5
                      hover:text-foreground
                      hover:shadow-none
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

                  `,
									selected
										? `
                        bg-primary
                        text-primary-foreground
                      `
										: `
                        bg-transparent
                        text-muted-foreground

                        group-hover:text-foreground
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
                          text-muted-foreground
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
          glass-chip mt-5 grid gap-3 rounded-2xl
          p-4
          text-foreground

        "
				aria-label="Relationship statistics"
			>
				<div>
					<p
						className="
              text-xs font-semibold text-muted-foreground
            "
					>
						Days together
					</p>

					<p className="mt-1 font-serif text-4xl leading-none">
						{relationshipStats.daysTogether}
					</p>
				</div>

				{/* Stacked rather than two narrow columns so long dates never wrap. */}
				<div className="rounded-xl bg-surface-elevated/70 px-3 py-2.5 dark:bg-white/5">
					<p className="text-xs font-semibold text-muted-foreground">Next anniversary</p>
					<p className="mt-1 whitespace-nowrap text-base font-semibold tabular-nums text-foreground">
						{relationshipStats.countdown}
					</p>
					<p className="truncate text-xs text-muted-foreground">{relationshipStats.nextMonthlyLabel}</p>
				</div>
			</section>

			{/* Actions */}
			<div className="mt-auto pt-5">
				<div className="mb-2 flex items-center justify-between px-2">
					<p
						className="
              text-xs font-semibold
              text-subtle-foreground
            "
					>
						Actions
					</p>

					<div
						aria-hidden="true"
						className="
              ml-3 h-px flex-1
              bg-foreground/10
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
              h-11 justify-start rounded-xl bg-transparent
              text-danger
              hover:bg-danger-bg
              hover:text-danger
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
