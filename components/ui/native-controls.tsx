"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export const style =
	"peer appearance-none w-full px-3 h-12 sm:h-11 text-sm text-neutral-900 bg-transparent rounded-xl sm:rounded-lg border border-neutral-300 shadow-none focus:shadow-none outline-none transition-all duration-200 focus:border-mui focus:ring-1 focus:ring-mui";


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
				"inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:rounded-md sm:active:scale-100",
				variant === "contained" &&
					"bg-neutral-900 text-white hover:bg-neutral-700",
				variant === "outlined" &&
					"border border-mui bg-transparent text-mui hover:bg-mui/10",
				variant === "text" && "bg-transparent text-mui hover:bg-mui/10",
				variant === "danger" && "bg-danger text-white hover:brightness-95",
				className,
			)}
		>
			{children}
		</button>
	);
}

export function FieldLabel({
	label,
	children,
	helperText,
	error,
	className,
}: {
	label: string;
	children: ReactNode;
	helperText?: string;
	error?: boolean;
	className?: string;
}) {
	return (
		<label className={cx("grid", className)}>
			<span
				className={cx(
					"text-[11px] font-semibold",
					error ? "text-danger" : "text-neutral-500",
				)}
			>
				{label}
			</span>
			{children}
			{helperText ? (
				<span
					className={cx(
						"text-xs leading-5",
						error ? "text-danger" : "text-neutral-500",
					)}
				>
					{helperText}
				</span>
			) : null}
		</label>
	);
}

export function NativeInput({
	label,
	helperText,
	error,
	className,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
	label: string;
	helperText?: string;
	error?: boolean;
}) {
	return (
		<div className="w-full">
			<div className="relative">
				<input
					{...props}
					placeholder=" "
					className={cx(
						style,
						error && "border-danger focus:border-danger focus:ring-danger",
						className,
					)}
				/>

				{/* Label phong cách MUI Outlined */}
				<label
					className={cx(
						// Ban đầu nhãn nằm lọt lòng giữa ô textarea giống placeholder
						"absolute left-3 top-3 text-sm text-neutral-500 transition-all duration-200 pointer-events-none origin-[top_left] px-1 bg-paper",

						// Khi FOCUS: Bay lên nằm đè lên border-top, thu nhỏ scale, đổi màu theo MUI
						"peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-mui",

						// Khi ĐÃ CÓ CHỮ (không hiện placeholder): Giữ nguyên vị trí trên border-top không bị tụt xuống
						"peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-5",
						error && "text-danger peer-focus:text-danger",
					)}
				>
					{label}
				</label>
			</div>

			{helperText ? (
				<span
					className={cx(
						"mt-1 text-xs block leading-5",
						error ? "text-danger" : "text-neutral-500",
					)}
				>
					{helperText}
				</span>
			) : null}
		</div>
	);
}

export function NativeTextarea({
	label,
	helperText,
	error,
	className,
	rows = 8,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label: string;
	helperText?: string;
	error?: boolean;
}) {
	return (
		<div className="w-full">
			{/* Container chính cần relative */}
			<div className="relative">
				<textarea
					{...props}
					rows={rows}
					placeholder=" "
					className={cx(
            style,
            "h-auto min-h-[120px] py-3",
						error && "border-danger focus:border-danger focus:ring-danger",
						className,
					)}
				/>

				{/* Label phong cách MUI Outlined */}
				<label
          className={cx(
						// Ban đầu nhãn nằm lọt lòng giữa ô textarea giống placeholder
						"absolute left-3 top-3 text-sm text-neutral-500 transition-all duration-200 pointer-events-none origin-[top_left] px-1 bg-paper",

						// Khi FOCUS: Bay lên nằm đè lên border-top, thu nhỏ scale, đổi màu theo MUI
						"peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-mui",

						// Khi ĐÃ CÓ CHỮ (không hiện placeholder): Giữ nguyên vị trí trên border-top không bị tụt xuống
						"peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-5",

						// Xử lý màu sắc khi có lỗi (error)
						error && "text-danger peer-focus:text-danger",
					)}
				>
					{label}
				</label>
			</div>

			{helperText ? (
				<span
					className={cx(
						"mt-1 text-xs block leading-5",
						error ? "text-danger" : "text-neutral-500",
					)}
				>
					{helperText}
				</span>
			) : null}
		</div>
	);
}

export function NativeSelect({
	label,
	children,
	className,
	containerClassName,
	value,
	defaultValue, // Đón nhận thêm prop này
	labelBgClass = "bg-paper",
	...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
	label: string;
	labelBgClass?: string;
	containerClassName?: string;
	children: ReactNode;
}) {
	const hasValue =
		(value !== undefined && value !== null && value !== "") ||
		(defaultValue !== undefined &&
			defaultValue !== null &&
			defaultValue !== "");

	return (
		<div className={cx("w-full", containerClassName)}>
			<div className="relative">
				<select
					{...props}
					value={value}
					defaultValue={defaultValue} // Truyền vào thẻ select native
					className={cx(
						style,

						className,
					)}
				>
					{children}
				</select>

				{/* Icon mũi tên xuống */}
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>

				{/* Label phong cách MUI Outlined */}
				<label
					className={cx(
						// Ban đầu nhãn nằm lọt lòng giữa ô textarea giống placeholder
						"absolute left-3 top-3 text-sm text-neutral-500 transition-all duration-200 pointer-events-none origin-[top_left] px-1 " +
							labelBgClass,
						// Khi FOCUS: Bay lên nằm đè lên border-top, thu nhỏ scale, đổi màu theo MUI
						"peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-mui",
						// Khi ĐÃ CÓ CHỮ (không hiện placeholder): Giữ nguyên vị trí trên border-top không bị tụt xuống
						"peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-5",
						// Nếu có value hoặc defaultValue, nhãn sẽ cố định ở viền trên
						hasValue && "scale-75 -translate-y-5",
					)}
				>
					{label}
				</label>
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
			className={cx("flex border-b border-neutral-200", className)}
		>
			{options.map((option) => {
				const selected = value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={selected}
						className={cx(
							"min-h-11 px-4 text-sm font-bold transition",
							selected
								? "border-b-2 border-mui text-mui"
								: "text-neutral-500 hover:text-neutral-900",
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
	maxWidth = "sm",
}: {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
	actions?: ReactNode;
	maxWidth?: "xs" | "sm" | "md";
}) {
	const canUsePortal = typeof document !== "undefined";
	const [shouldRender, setShouldRender] = useState(open);
	const closing = shouldRender && !open;

	useEffect(() => {
		if (open) {
			setShouldRender(true);
			return;
		}

		if (!shouldRender) return;

		const timeoutId = window.setTimeout(() => {
			setShouldRender(false);
		}, 300);

		return () => window.clearTimeout(timeoutId);
	}, [open, shouldRender]);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose, open]);

	if (!shouldRender) return null;

	const dialog = (
		<div
			className={cx(
				"native-dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4",
				closing ? "native-dialog-backdrop-out" : "native-dialog-backdrop-in",
			)}
		>
			<button
				type="button"
				aria-label="Close dialog"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-modal="true"
				className={cx(
					"mobile-sheet-motion relative max-h-[calc(100svh-env(safe-area-inset-top)-0.75rem)] w-full origin-bottom overflow-hidden rounded-t-[2.1rem] bg-paper shadow-2xl will-change-transform sm:max-h-[calc(100svh-2rem)] sm:origin-center sm:rounded-lg",
					closing ? "native-sheet-out" : "native-sheet-in",
					maxWidth === "xs" && "max-w-md",
					maxWidth === "sm" && "max-w-xl",
					maxWidth === "md" && "max-w-3xl",
				)}
			>
				<div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-neutral-300 sm:hidden" />
				<div className="px-5 pt-4 sm:px-6 sm:pt-6">
					<div className="font-serif text-2xl leading-tight text-neutral-900 sm:text-3xl">
						{title}
					</div>
				</div>
				<div className="max-h-[calc(100svh-env(safe-area-inset-top)-11rem)] overflow-y-auto px-5 py-5 overscroll-contain sm:max-h-[calc(100svh-12rem)] sm:px-6">
					{children}
				</div>
				{actions ? (
					<div className="flex justify-end gap-3 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6 sm:pb-6">{actions}</div>
				) : null}
			</div>
		</div>
	);

	return canUsePortal ? createPortal(dialog, document.body) : dialog;
}
