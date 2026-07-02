"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastVariant = "success" | "info" | "warning" | "error";
type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
};
type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
};

const styles: Record<
  ToastVariant,
  { shell: string; icon: string; progress: string; label: string }
> = {
  success: {
    shell: "border-emerald-200",
    icon: "bg-emerald-50 text-emerald-700",
    progress: "bg-emerald-600",
    label: "Success",
  },
  info: {
    shell: "border-sky-200",
    icon: "bg-sky-50 text-sky-700",
    progress: "bg-sky-600",
    label: "Info",
  },
  warning: {
    shell: "border-amber-200",
    icon: "bg-amber-50 text-amber-700",
    progress: "bg-amber-500",
    label: "Attention",
  },
  error: {
    shell: "border-red-200",
    icon: "bg-red-50 text-red-700",
    progress: "bg-red-600",
    label: "Error",
  },
};

const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(
  null,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [
      ...current.slice(-3),
      {
        id,
        message,
        variant: options?.variant ?? "success",
        duration: options?.duration ?? 2000,
      },
    ]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => showToast, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDone={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return showToast;
}

export function Toast({
  message,
  variant = "success",
  duration = 2000,
  onDone,
}: {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDone?: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const style = styles[variant];
  const Icon =
    variant === "success"
      ? CheckCircle2
      : variant === "info"
        ? Info
        : variant === "warning"
          ? AlertTriangle
          : XCircle;

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onDone?.(), 200);
  }, [closing, onDone]);

  useEffect(() => {
    const timer = window.setTimeout(close, duration);
    return () => window.clearTimeout(timer);
  }, [close, duration]);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`relative w-full overflow-hidden rounded-lg border bg-white ${style.shell} ${closing ? "toast-out" : "toast-in"}`}
    >
      <div className="flex items-start gap-3 p-4 pr-11">
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-full ${style.icon}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>
        <div className="pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {style.label}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Close notification"
        className="absolute right-3 top-3 p-2 text-neutral-400 transition hover:text-ink"
      >
        <X size={16} />
      </button>
      <div
        className={`h-0.5 origin-left toast-progress ${style.progress}`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}
