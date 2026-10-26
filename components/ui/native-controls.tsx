"use client";

import {
	useId,
	type ButtonHTMLAttributes,
	type ReactNode,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useHydrated } from "@/components/common/use-hydrated";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export const style =
	"glass-input h-12 w-full min-w-0 appearance-none rounded-xl border border-input px-3.5 text-base text-foreground outline-none transition-all duration-200 placeholder:text-subtle-foreground sm:h-11";

export function NativeButton({
	variant = "contained",
	className,
	children,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "contained" | "outlined" | "text" | "danger";
}) {
	return (
		<button
			{...props}
			className={cx(
				"glass-button inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11",
				variant === "contained" &&
					"bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
				variant === "outlined" &&
					"glass-chip text-foreground hover:bg-surface-hover",
				variant === "text" &&
					"bg-transparent text-foreground hover:bg-surface-hover",
				variant === "danger" &&
					"border border-transparent bg-transparent text-danger hover:bg-danger-bg",
				className,
			)}
		>
			{children}
		</button>
	);
}

export function NativeInput({ label, id, helperText, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & {
	label: string; helperText?: string; error?: boolean;
}) {
	const generatedId = useId();
	const controlId = id ?? generatedId;
	return (
		<div className="grid min-w-0 gap-2">
			<label htmlFor={controlId} className="text-sm font-semibold text-foreground">{label}{props.required ? <span className="ml-1 text-muted-foreground" aria-hidden="true">*</span> : null}</label>
			<input {...props} id={controlId} aria-invalid={error || undefined} aria-describedby={props["aria-describedby"] ?? (helperText ? `${controlId}-help` : undefined)} className={cx(style, error && "border-danger focus:border-danger focus:ring-danger/20", className)} />
			{helperText ? <p id={`${controlId}-help`} className={cx("text-xs leading-5", error ? "text-danger" : "text-muted-foreground")}>{helperText}</p> : null}
		</div>
	);
}

export function NativeTextarea({ label, id, helperText, error, className, rows = 8, style: inlineStyle, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label: string; helperText?: string; error?: boolean;
}) {
	const generatedId = useId();
	const controlId = id ?? generatedId;
	return (
		<div className="grid min-w-0 gap-2">
			<label htmlFor={controlId} className="text-sm font-semibold text-foreground">{label}{props.required ? <span className="ml-1 text-muted-foreground" aria-hidden="true">*</span> : null}</label>
			<textarea {...props} id={controlId} rows={rows} aria-invalid={error || undefined} aria-describedby={props["aria-describedby"] ?? (helperText ? `${controlId}-help` : undefined)} style={{ minHeight: `${Math.max(rows, 3) * 1.5 + 1.5}rem`, ...inlineStyle }} className={cx(style, "h-auto resize-y py-3 leading-7", error && "border-danger focus:border-danger focus:ring-danger/20", className)} />
			{helperText ? <p id={`${controlId}-help`} className={cx("text-xs leading-5", error ? "text-danger" : "text-muted-foreground")}>{helperText}</p> : null}
		</div>
	);
}

export function NativeSelect({ label, id, children, className, containerClassName, hideLabel = false, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & {
	label: string; containerClassName?: string; hideLabel?: boolean; children: ReactNode;
}) {
	const generatedId = useId();
	const controlId = id ?? generatedId;
	return (
		<div className={cx("grid min-w-0 gap-2", containerClassName)}>
			<label htmlFor={controlId} className={hideLabel ? "sr-only" : "text-sm font-semibold text-foreground"}>{label}</label>
			<div className="relative min-w-0">
				<select {...props} id={controlId} className={cx(style, "pr-10", className)}>{children}</select>
				<svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
			</div>
		</div>
	);
}

export function NativeTabs<T extends string>({
	value,
	options,
	onChange,
	className,
}: {
	value: T;
	options: Array<{ value: T; label: string }>;
	onChange: (value: T) => void;
	className?: string;
}) {
	return (
		<div
			role="tablist"
			className={cx("glass-chip inline-flex gap-1 rounded-full p-1", className)}
		>
			{options.map((option) => {
				const selected = value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={selected}
						tabIndex={selected ? 0 : -1}
						onKeyDown={(event) => {
							const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
							if (!keys.includes(event.key)) return;
							event.preventDefault();
							const index = options.findIndex((item) => item.value === value);
							const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
							onChange(options[next].value);
							(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next])?.focus();
						}}
						className={cx(
							"min-h-10 rounded-full px-4 text-sm font-semibold transition",
							selected
								? "bg-surface-elevated text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12)] dark:bg-primary-container-hover"
								: "text-muted-foreground hover:text-foreground",
						)}
						onClick={() => onChange(option.value)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export function NativeDialog({
	open,
	onClose,
	title,
	children,
	actions,
	showHandle = true,
	showTitle = true,
	closeLabel = "Close dialog",
	contentClassName,
	maxWidth = "sm",
}: {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
	actions?: ReactNode;
	showHandle?: boolean;
	showTitle?: boolean;
	closeLabel?: string;
	contentClassName?: string;
	maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
	const hydrated = useHydrated();
	return (
		<DialogPrimitive.Root open={hydrated && open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className="glass-scrim app-dialog-overlay fixed inset-0 z-50" />
				<DialogPrimitive.Popup
					className={cx(
						"glass-dialog app-dialog mobile-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[calc(100svh-env(safe-area-inset-top)-0.75rem)] w-full flex-col overflow-hidden rounded-t-3xl border text-foreground outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100svh-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
						maxWidth === "xs" && "sm:w-[min(92vw,28rem)]",
						maxWidth === "sm" && "sm:w-[min(92vw,36rem)]",
						maxWidth === "md" && "sm:w-[min(92vw,48rem)]",
						maxWidth === "lg" && "sm:w-[min(92vw,56rem)]",
						maxWidth === "xl" && "sm:w-[min(92vw,64rem)]",
					)}
				>
					{showHandle ? <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-foreground/15 sm:hidden" /> : null}
					<div className={showTitle ? "flex shrink-0 items-start justify-between gap-3 border-b border-foreground/8 px-5 py-4 sm:px-6" : "absolute right-3 top-3 z-10"}>
						<DialogPrimitive.Title className={showTitle ? "min-w-0 pt-1 font-serif text-2xl leading-tight [overflow-wrap:anywhere] sm:text-3xl" : "sr-only"}>{title}</DialogPrimitive.Title>
						<DialogPrimitive.Close aria-label={closeLabel} className="glass-chip ml-auto grid size-11 shrink-0 place-items-center rounded-full text-foreground transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"><X size={20} aria-hidden="true" /></DialogPrimitive.Close>
					</div>
					<div className={cx("min-h-0 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 sm:p-6", contentClassName)}>
						{children}
					</div>
					{actions ? <div className="flex shrink-0 justify-end gap-3 border-t border-foreground/8 p-5 sm:p-6">{actions}</div> : null}
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
