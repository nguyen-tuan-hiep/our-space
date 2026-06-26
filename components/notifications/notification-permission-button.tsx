"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Bell, BellOff } from "lucide-react";
import { useSnackbar } from "notistack";
import { createClient } from "@/lib/supabase/browser";

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferredQueue;
  }
}

type OneSignalDeferredQueue = Array<(oneSignal: OneSignalWebSdk) => void | Promise<void>> & {
  push(callback: (oneSignal: OneSignalWebSdk) => void | Promise<void>): number;
};

interface OneSignalWebSdk {
  init(options: {
    appId: string;
    serviceWorkerPath?: string;
    serviceWorkerParam?: { scope: string };
    notifyButton?: { enable: boolean };
    welcomeNotification?: { disable: boolean };
    promptOptions?: {
      slidedown?: {
        prompts?: Array<{
          type: "push";
          autoPrompt: boolean;
          text?: {
            actionMessage?: string;
            acceptButton?: string;
            cancelButton?: string;
          };
        }>;
      };
    };
  }): Promise<void>;
  login(externalId: string): Promise<void>;
  Slidedown: {
    promptPush(options?: { force?: boolean }): Promise<void> | void;
  };
  Notifications: {
    permission: boolean;
    requestPermission(): Promise<boolean>;
    isPushSupported(): boolean;
    addEventListener(
      event: "permissionChange",
      callback: (granted: boolean) => void,
    ): void;
  };
  User: {
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
      optIn(): Promise<void>;
      addEventListener(
        event: "change",
        callback: (event: {
          current: { id: string | null; optedIn: boolean };
        }) => void,
      ): void;
    };
  };
}

interface NotificationPermissionButtonProps {
  userId: string;
  initialSubscriptionId: string | null;
}

const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

let oneSignalScriptPromise: Promise<void> | null = null;
let oneSignalInitPromise: Promise<OneSignalWebSdk> | null = null;

function loadOneSignalScript() {
  if (oneSignalScriptPromise) return oneSignalScriptPromise;

  oneSignalScriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector<HTMLScriptElement>("#onesignal-sdk")) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load OneSignal SDK."));
    document.head.appendChild(script);
  });

  return oneSignalScriptPromise;
}

function runWhenOneSignalReady<T>(
  callback: (oneSignal: OneSignalWebSdk) => Promise<T>,
) {
  return new Promise<T>((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (oneSignal) => {
      try {
        resolve(await callback(oneSignal));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function saveSubscription(userId: string, subscriptionId: string | null) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ onesignal_subscription_id: subscriptionId })
    .eq("id", userId);

  if (error) throw error;
}

async function getOneSignal(userId: string) {
  if (!oneSignalAppId) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID is not configured.");
  }

  if (oneSignalInitPromise) {
    const oneSignal = await oneSignalInitPromise;
    await oneSignal.login(userId);
    return oneSignal;
  }

  window.OneSignalDeferred = window.OneSignalDeferred ?? [];
  await loadOneSignalScript();

  oneSignalInitPromise = runWhenOneSignalReady(async (oneSignal) => {
    await oneSignal.init({
      appId: oneSignalAppId,
      serviceWorkerPath: "OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/" },
      notifyButton: { enable: false },
      welcomeNotification: { disable: true },
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: false,
              text: {
                actionMessage: "Allow private note and finance notifications?",
                acceptButton: "Allow",
                cancelButton: "Not now",
              },
            },
          ],
        },
      },
    });

    await oneSignal.login(userId);
    return oneSignal;
  });

  return oneSignalInitPromise;
}

export function NotificationPermissionButton({
  userId,
  initialSubscriptionId,
}: NotificationPermissionButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [subscriptionId, setSubscriptionId] = useState(initialSubscriptionId);
  const subscriptionIdRef = useRef(initialSubscriptionId);
  const [supported, setSupported] = useState(true);
  const [pending, setPending] = useState(false);

  const enabled = useMemo(() => Boolean(subscriptionId), [subscriptionId]);

  useEffect(() => {
    if (!oneSignalAppId || !("serviceWorker" in navigator)) {
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
      .catch(() => setSupported(false));

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not enable notifications.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setPending(false);
    }
  }, [enqueueSnackbar, userId]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outlined"
      size="small"
      startIcon={enabled ? <Bell size={16} /> : <BellOff size={16} />}
      disabled={pending || enabled}
      onClick={handleEnableNotifications}
      className="min-h-10 bg-paper"
    >
      {enabled ? "Notifications on" : "Enable notifications"}
    </Button>
  );
}
