"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const fieldClass =
  "min-h-12 w-full rounded-lg border border-neutral-300 bg-paper px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-mui focus:ring-2 focus:ring-mui/20 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass =
  "w-full rounded-lg border border-neutral-300 bg-paper px-3 py-3 text-sm leading-6 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-mui focus:ring-2 focus:ring-mui/20 disabled:cursor-not-allowed disabled:opacity-60";

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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "contained" && "bg-neutral-900 text-white hover:bg-neutral-700",
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
      <span className={cx("text-[11px] font-semibold", error ? "text-danger" : "text-neutral-500")}>
        {label}
      </span>
      {children}
      {helperText ? (
        <span className={cx("text-xs leading-5", error ? "text-danger" : "text-neutral-500")}>
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
    <FieldLabel label={label} helperText={helperText} error={error}>
      <input
        {...props}
        className={cx(fieldClass, error && "border-danger focus:border-danger focus:ring-danger/20", className)}
      />
    </FieldLabel>
  );
}

export function NativeTextarea({
  label,
  helperText,
  error,
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helperText?: string;
  error?: boolean;
}) {
  return (
    <FieldLabel label={label} helperText={helperText} error={error}>
      <textarea
        {...props}
        rows={rows}
        className={cx(textareaClass, error && "border-danger focus:border-danger focus:ring-danger/20", className)}
      />
    </FieldLabel>
  );
}

export function NativeSelect({
  label,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <FieldLabel label={label}>
      <select {...props} className={cx(fieldClass, className)}>
        {children}
      </select>
    </FieldLabel>
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
    <div role="tablist" className={cx("flex border-b border-neutral-200", className)}>
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

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const dialog = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
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
          "relative max-h-[calc(100svh-2rem)] w-full overflow-hidden rounded-lg bg-paper shadow-2xl",
          maxWidth === "xs" && "max-w-md",
          maxWidth === "sm" && "max-w-xl",
          maxWidth === "md" && "max-w-3xl",
        )}
      >
        <div className="px-6 pt-6">
          <div className="font-serif text-3xl leading-tight text-neutral-900">
            {title}
          </div>
        </div>
        <div className="max-h-[calc(100svh-12rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
        {actions ? (
          <div className="flex justify-end gap-3 px-6 pb-6">{actions}</div>
        ) : null}
      </div>
    </div>
  );

  return canUsePortal ? createPortal(dialog, document.body) : dialog;
}
