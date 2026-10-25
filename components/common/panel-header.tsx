import type { ReactNode } from "react";

/** Consistent hierarchy for each section, with space for filters and actions. */
export function PanelHeader({ title, description, children }: {
	title: string;
	description: string;
	children?: ReactNode;
}) {
	return (
		<header className="panel-header flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
			<div className="min-w-0 flex-1 basis-48">
				<h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h2>
				<p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">{description}</p>
			</div>
			{children ? <div className="flex shrink-0 items-center gap-3">{children}</div> : null}
		</header>
	);
}
