"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/toast";
import { getOneSignal, isOneSignalConfigured } from "@/lib/onesignal-web";

const menuItemClass =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";
const outlineButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-mui bg-paper px-4 text-sm font-bold text-mui transition hover:bg-mui/10 disabled:cursor-not-allowed disabled:opacity-50";

interface NotificationPermissionButtonProps {
  userId: string;
  variant?: "button" | "menu-item";
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
          updateCurrentSubscription(
            event.current.id,
            event.current.optedIn,
          );
        });

        oneSignal.Notifications.addEventListener("permissionChange", (granted) => {
          if (!granted) updateCurrentSubscription(null, false);
        });
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
        error instanceof Error ? error.message : "Could not enable notifications.";
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
          console.warn("OneSignal opt-out failed; clearing local subscription", error);
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

  if (variant === "menu-item") {
    const Icon = enabled ? BellOff : Bell;

    return (
      <button
        type="button"
        role="menuitem"
        disabled={pending || checking}
        onClick={handleToggleNotifications}
        className={menuItemClass}
      >
        <Icon size={16} />
        {checking
          ? "Checking notifications"
          : enabled
            ? "Turn off notifications"
            : "Enable notifications"}
      </button>
    );
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={pending || checking}
      onClick={handleToggleNotifications}
      className={outlineButtonClass}
    >
      {enabled ? <BellOff size={17} /> : <Bell size={17} />}
      {checking
        ? "Checking notifications"
        : enabled
          ? "Turn off notifications"
          : "Enable notifications"}
    </button>
  );
}
