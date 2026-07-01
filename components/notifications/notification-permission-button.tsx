"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/toast";
import { getOneSignal, isOneSignalConfigured } from "@/lib/onesignal-web";

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
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOneSignalConfigured() || !("serviceWorker" in navigator)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;
    const oneSignal = window.__oneSignalInitialized ? window.__oneSignal : null;
    if (!oneSignal) return;

    void oneSignal
      .login(userId)
      .then(() => {
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
      <MenuItem
        disabled={pending}
        onClick={handleToggleNotifications}
      >
        <Icon
          size={16}
          className="mr-2"
        />
        {enabled ? "Turn off notifications" : "Enable notifications"}
      </MenuItem>
    );
  }

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outlined"
      size="small"
      startIcon={enabled ? <Bell size={16} /> : <BellOff size={16} />}
      disabled={pending}
      onClick={handleToggleNotifications}
      className="min-h-10 bg-paper"
    >
      {enabled ? "Turn off notifications" : "Enable notifications"}
    </Button>
  );
}
