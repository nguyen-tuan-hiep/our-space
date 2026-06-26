"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { Bell, BellOff } from "lucide-react";
import { useSnackbar } from "notistack";
import { createClient } from "@/lib/supabase/browser";
import { getOneSignal, isOneSignalConfigured } from "@/lib/onesignal-web";

interface NotificationPermissionButtonProps {
  userId: string;
  initialSubscriptionId: string | null;
  variant?: "button" | "menu-item";
  onDone?: () => void;
}

async function saveSubscription(userId: string, subscriptionId: string | null) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ onesignal_subscription_id: subscriptionId })
    .eq("id", userId);

  if (error) throw error;
}

export function NotificationPermissionButton({
  userId,
  initialSubscriptionId,
  variant = "button",
  onDone,
}: NotificationPermissionButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [subscriptionId, setSubscriptionId] = useState(initialSubscriptionId);
  const subscriptionIdRef = useRef(initialSubscriptionId);
  const [supported, setSupported] = useState(true);
  const [pending, setPending] = useState(false);

  const enabled = useMemo(() => Boolean(subscriptionId), [subscriptionId]);

  useEffect(() => {
    if (!isOneSignalConfigured() || !("serviceWorker" in navigator)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;

    getOneSignal(userId)
      .then((oneSignal) => {
        if (cancelled) return;

        setSupported(oneSignal.Notifications.isPushSupported());

        const persistCurrentSubscription = async (id: string | null) => {
          if (cancelled) return;
          subscriptionIdRef.current = id;
          setSubscriptionId(id);
          await saveSubscription(userId, id);
        };

        const currentId = oneSignal.User.PushSubscription.id;
        if (currentId && currentId !== subscriptionIdRef.current) {
          void persistCurrentSubscription(currentId);
        }

        oneSignal.User.PushSubscription.addEventListener("change", (event) => {
          void persistCurrentSubscription(
            event.current.optedIn ? event.current.id : null,
          );
        });

        oneSignal.Notifications.addEventListener("permissionChange", (granted) => {
          if (!granted) void persistCurrentSubscription(null);
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
        enqueueSnackbar("This browser does not support web push notifications.", {
          variant: "warning",
        });
        return;
      }

      await oneSignal.Slidedown.promptPush({ force: true });

      if (!oneSignal.Notifications.permission) {
        const granted = await oneSignal.Notifications.requestPermission();
        if (!granted) {
          enqueueSnackbar("Notifications were not enabled.", { variant: "info" });
          return;
        }
      }

      if (!oneSignal.User.PushSubscription.optedIn) {
        await oneSignal.User.PushSubscription.optIn();
      }

      const currentSubscriptionId = oneSignal.User.PushSubscription.id;
      if (!currentSubscriptionId) {
        throw new Error("OneSignal did not return a subscription ID yet.");
      }

      await saveSubscription(userId, currentSubscriptionId);
      subscriptionIdRef.current = currentSubscriptionId;
      setSubscriptionId(currentSubscriptionId);
      enqueueSnackbar("Notifications enabled.", { variant: "success" });
      onDone?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not enable notifications.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setPending(false);
    }
  }, [enqueueSnackbar, onDone, userId]);

  const handleDisableNotifications = useCallback(async () => {
    setPending(true);

    try {
      const oneSignal = await getOneSignal(userId);

      if (oneSignal.User.PushSubscription.optedIn) {
        await oneSignal.User.PushSubscription.optOut();
      }

      await saveSubscription(userId, null);
      subscriptionIdRef.current = null;
      setSubscriptionId(null);
      enqueueSnackbar("Notifications turned off.", { variant: "success" });
      onDone?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not turn off notifications.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setPending(false);
    }
  }, [enqueueSnackbar, onDone, userId]);

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
