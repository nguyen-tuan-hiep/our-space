"use client";

import {
	useEffect,
	useState,
	type ButtonHTMLAttributes,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export const style =
	"peer appearance-none w-full px-3 h-12 sm:h-11 text-sm text-neutral-900 bg-transparent rounded-2xl border border-neutral-400 shadow-none focus:shadow-none outline-none transition-all duration-200 focus:border-accentLight focus:ring-2 focus:ring-accentLight/15 dark:border-neutral-500/70 dark:bg-primaryDark/35 dark:text-white dark:placeholder:text-neutral-700 dark:focus:border-accentDark dark:focus:ring-accentDark/30";

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
				"inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition active:scale-[0.8] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11",
				variant === "contained" &&
					"bg-accentLight text-onAccentLight dark:bg-accentDark dark:text-onAccentDark hover:bg-accentHoverLight dark:hover:bg-accentHoverDark",
				variant === "outlined" &&
					"border border-accentLight bg-transparent text-accentLight hover:bg-accentContainerLight hover:text-onAccentContainerLight dark:border-neutral-500/60 dark:bg-secondaryDark dark:text-white dark:hover:border-accentDark dark:hover:bg-accentDark dark:hover:text-white",
				variant === "text" &&
					"bg-transparent text-accentLight hover:bg-accentContainerLight hover:text-onAccentContainerLight dark:text-white dark:hover:bg-hoverDark dark:hover:text-white",
				variant === "danger" &&
					"border border-transparent bg-transparent text-danger hover:bg-danger-bg dark:text-red-100 dark:hover:bg-danger/20 dark:hover:text-white",
				className,
			)}
		>
			{children}
		</button>
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
						error && "border-danger focus:border-danger focus:ring-danger/20",
						className,
					)}
				/>

				{/* Label phong cách MUI Outlined */}
				<label
					className={cx(
						// Ban đầu nhãn nằm lọt lòng giữa ô textarea giống placeholder
						"absolute left-3 top-3 text-sm text-neutral-500 transition-all duration-200 pointer-events-none origin-[top_left] px-1 bg-secondaryLight dark:bg-secondaryDark dark:text-neutral-800",

						// Khi FOCUS: Bay lên nằm đè lên border-top, thu nhỏ scale, đổi màu theo MUI
						"peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-accentLight dark:peer-focus:text-white",

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
						error ? "text-danger" : "text-neutral-500 dark:text-neutral-800",
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
	style: inlineStyle,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	label: string;
	helperText?: string;
	error?: boolean;
}) {
	const textareaMinHeight = `${Math.max(rows, 3) * 1.5 + 1.5}rem`;

	return (
		<div className="w-full">
			{/* Container chính cần relative */}
			<div className="relative">
				<textarea
					{...props}
					rows={rows}
					placeholder=" "
					style={{
						minHeight: textareaMinHeight,
						...inlineStyle,
					}}
					className={cx(
						style,
						"h-auto py-3",
						error && "border-danger focus:border-danger focus:ring-danger/20",
						className,
					)}
				/>

				{/* Label phong cách MUI Outlined */}
				<label
					className={cx(
						// Ban đầu nhãn nằm lọt lòng giữa ô textarea giống placeholder
						"absolute left-3 top-3 text-sm text-neutral-500 transition-all duration-200 pointer-events-none origin-[top_left] px-1 bg-secondaryLight dark:bg-secondaryDark dark:text-neutral-800",

						// Khi FOCUS: Bay lên nằm đè lên border-top, thu nhỏ scale, đổi màu theo MUI
						"peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-accentLight dark:peer-focus:text-white",

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
						error ? "text-danger" : "text-neutral-500 dark:text-neutral-800",
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
	labelBgClass = "bg-secondaryLight dark:bg-secondaryDark",
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
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 dark:text-neutral-800">
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
						"absolute left-3 top-3 text-sm text-neutral-500 transition-all duration-200 pointer-events-none origin-[top_left] px-1 dark:text-neutral-800 " +
							labelBgClass,
						// Khi FOCUS: Bay lên nằm đè lên border-top, thu nhỏ scale, đổi màu theo MUI
						"peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-accentLight dark:peer-focus:text-white",
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
			className={cx("flex border-b border-neutral-200 dark:border-neutral-700", className)}
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
								? "border-b-2 border-accentLight text-accentLight dark:border-accentDark dark:text-white"
								: "text-neutral-500 hover:text-neutral-900 dark:text-neutral-800 dark:hover:text-white",
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
	contentClassName?: string;
	maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
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
				"native-dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-accentLight/20 p-0 backdrop-blur-sm dark:bg-black/60 sm:grid sm:place-items-center sm:p-4",
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
					"mobile-sheet-motion relative flex max-h-[calc(100svh-env(safe-area-inset-top)-0.75rem)] w-full origin-bottom flex-col overflow-hidden rounded-2xl border border-accentLight/10 bg-secondaryLight shadow-2xl will-change-transform dark:border-neutral-500/30 dark:bg-secondaryDark dark:text-white sm:max-h-[calc(100svh-2rem)] sm:origin-center",
					closing ? "native-sheet-out" : "native-sheet-in",
					maxWidth === "xs" && "sm:w-[min(92vw,28rem)] sm:max-w-none",
					maxWidth === "sm" && "sm:w-[min(92vw,36rem)] sm:max-w-none",
					maxWidth === "md" && "sm:w-[min(92vw,48rem)] sm:max-w-none",
					maxWidth === "lg" && "sm:w-[min(92vw,56rem)] sm:max-w-none",
					maxWidth === "xl" && "sm:w-[min(92vw,64rem)] sm:max-w-none",
				)}
			>
				{showHandle ? (
					<div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-accentLight/20 sm:hidden" />
				) : null}
				{showTitle ? (
					<div className="px-5 pt-4 sm:px-6 sm:pt-6">
						<div className="font-serif text-2xl leading-tight text-neutral-900 dark:text-white sm:text-3xl">
							{title}
						</div>
					</div>
				) : null}
				<div
					className={cx(
						"min-h-0 overflow-y-auto p-5 overscroll-contain sm:p-6",
						contentClassName,
					)}
				>
					{children}
				</div>
				{actions ? (
					<div className="shrink-0 flex justify-end gap-3 p-6">{actions}</div>
				) : null}
			</div>
		</div>
	);

	return canUsePortal ? createPortal(dialog, document.body) : dialog;
}
