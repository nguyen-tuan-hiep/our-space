"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/feedback/toast";
import { getOneSignal, isOneSignalConfigured } from "@/lib/onesignal-web";
import { Button } from "@/components/ui/button";

const menuItemClass =
	"flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 rounded-2xl bg-hoverLight/70 transition hover:bg-accentContainerLight hover:text-onAccentContainerLight dark:bg-hoverDark/55 dark:text-neutral-900 dark:hover:bg-accentContainerDark dark:hover:text-onAccentContainerDark disabled:cursor-not-allowed disabled:opacity-50";

interface NotificationPermissionButtonProps {
	userId: string;
	variant?: "button" | "menu-item";
	className?: string;
	iconClassName?: string;
	loadingClassName?: string;
	onDone?: () => void;
}

async function waitForSubscriptionId(
	getSubscriptionId: () => string | null,
	timeoutMs = 10000,
) {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeoutMs) {
		const subscriptionId = getSubscriptionId();
		if (subscriptionId) return subscriptionId;
		await new Promise((resolve) => window.setTimeout(resolve, 500));
	}

	return null;
}

export function NotificationPermissionButton({
	userId,
	variant = "button",
	className,
	iconClassName,
	loadingClassName,
	onDone,
}: NotificationPermissionButtonProps) {
	const toast = useToast();
	const [enabled, setEnabled] = useState(false);
	const [supported, setSupported] = useState(true);
	const [checking, setChecking] = useState(true);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		if (!isOneSignalConfigured() || !("serviceWorker" in navigator)) {
			setSupported(false);
			setChecking(false);
		}
	}, []);

	useEffect(() => {
		if (!supported) return;

		let cancelled = false;

		void getOneSignal(userId)
			.then(() => {
				const oneSignal = window.__oneSignal;
				if (!oneSignal) return;
				if (cancelled) return;

				setSupported(oneSignal.Notifications.isPushSupported());

				const updateCurrentSubscription = (
					id: string | null,
					isOptedIn: boolean,
				) => {
					if (cancelled) return;
					setEnabled(Boolean(id) && isOptedIn);
				};

				const currentId = oneSignal.User.PushSubscription.id;
				const currentOptedIn = oneSignal.User.PushSubscription.optedIn;
				updateCurrentSubscription(currentId, currentOptedIn);
				setChecking(false);

				oneSignal.User.PushSubscription.addEventListener("change", (event) => {
					updateCurrentSubscription(event.current.id, event.current.optedIn);
				});

				oneSignal.Notifications.addEventListener(
					"permissionChange",
					(granted) => {
						if (!granted) updateCurrentSubscription(null, false);
					},
				);
			})
			.catch((error) => {
				console.warn("OneSignal subscription state check failed", error);
				if (!cancelled) setChecking(false);
			});

		return () => {
			cancelled = true;
		};
	}, [supported, userId]);

	const handleEnableNotifications = useCallback(async () => {
		setPending(true);

		try {
			const oneSignal = await getOneSignal(userId);

			if (!oneSignal.Notifications.isPushSupported()) {
				setSupported(false);
				toast("This browser does not support web push notifications.", {
					variant: "warning",
				});
				return;
			}

			await oneSignal.Slidedown.promptPush({ force: true });

			if (!oneSignal.Notifications.permission) {
				const granted = await oneSignal.Notifications.requestPermission();
				if (!granted) {
					toast("Notifications were not enabled.", { variant: "info" });
					return;
				}
			}

			if (!oneSignal.User.PushSubscription.optedIn) {
				await oneSignal.User.PushSubscription.optIn();
			}

			const currentSubscriptionId = await waitForSubscriptionId(
				() => oneSignal.User.PushSubscription.id,
			);
			if (!currentSubscriptionId) {
				throw new Error(
					"OneSignal is still creating this device subscription. Please try again in a few seconds.",
				);
			}

			setEnabled(true);
			toast("Notifications enabled.", { variant: "success" });
			onDone?.();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Could not enable notifications.";
			toast(message, { variant: "error" });
		} finally {
			setPending(false);
		}
	}, [toast, onDone, userId]);

	const handleDisableNotifications = useCallback(async () => {
		setPending(true);

		try {
			if ("serviceWorker" in navigator) {
				try {
					const oneSignal = await getOneSignal(userId);

					if (oneSignal.User.PushSubscription.optedIn) {
						await oneSignal.User.PushSubscription.optOut();
					}
				} catch (error) {
					console.warn(
						"OneSignal opt-out failed; clearing local subscription",
						error,
					);
				}
			}

			setEnabled(false);
			toast("Notifications turned off.", { variant: "success" });
			onDone?.();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Could not turn off notifications.";
			toast(message, { variant: "error" });
		} finally {
			setPending(false);
		}
	}, [toast, onDone, userId]);

	const handleToggleNotifications = enabled
		? handleDisableNotifications
		: handleEnableNotifications;

	if (checking) {
		return variant === "menu-item" ? (
			<div className="flex items-center gap-2 px-4 py-2.5">
				<Skeleton className="size-4 rounded-full" />
				<Skeleton className="h-4 flex-1 rounded-full" />
			</div>
		) : (
			<Skeleton className={loadingClassName ?? "h-11 w-48 rounded-2xl"} />
		);
	}

	if (variant === "menu-item") {
		const Icon = enabled ? BellOff : Bell;

		return (
			<Button
				type="button"
				role="menuitem"
				variant="secondary"
				disabled={pending || checking}
				onClick={handleToggleNotifications}
				className={menuItemClass}
			>
				<Icon
					size={16}
					className={iconClassName}
				/>
				{enabled ? "Turn off notifications" : "Enable notifications"}
			</Button>
		);
	}

	if (!supported) return null;

	return (
		<Button
			type="button"
			variant="outline"
			size="lg"
			disabled={pending || checking}
			onClick={handleToggleNotifications}
			className={className ?? "h-11 rounded-2xl px-5 font-bold"}
		>
			{enabled ? (
				<BellOff
					size={17}
					className={iconClassName}
				/>
			) : (
				<Bell
					size={17}
					className={iconClassName}
				/>
			)}
			{enabled ? "Turn off notifications" : "Enable notifications"}
		</Button>
	);
}
