"use client";

import { AvatarIcon } from "@/components/avatar-icon";

interface NameWithAvatarProps {
	value: string | null;
	label: string;
	subtitle?: string;
	className?: string;
	nameClassName?: string;
	iconClassName?: string;
}

export function NameWithAvatar({
	value,
	label,
	subtitle,
	className,
	nameClassName,
	iconClassName,
}: NameWithAvatarProps) {
	return (
		<div className={className ?? "flex items-center gap-1.5"}>
			<AvatarIcon
				value={value}
				label={label}
				className={
					iconClassName ??
					"grid size-6 shrink-0 place-items-center rounded-full text-sm leading-none"
				}
			/>
			<div className="min-w-0 leading-tight">
				<p
					className={
						nameClassName ?? "truncate text-sm font-semibold leading-none"
					}
				>
					{label}
				</p>
				{subtitle ? (
					<p className="truncate text-xs text-neutral-500">{subtitle}</p>
				) : null}
			</div>
		</div>
	);
}
