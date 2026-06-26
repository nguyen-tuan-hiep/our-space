type OneSignalDeferredQueue = Array<
  (oneSignal: OneSignalWebSdk) => void | Promise<void>
> & {
  push(callback: (oneSignal: OneSignalWebSdk) => void | Promise<void>): number;
};

export interface OneSignalWebSdk {
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

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferredQueue;
    __oneSignalInitPromise?: Promise<OneSignalWebSdk>;
    __oneSignalInitialized?: boolean;
  }
}

export const ONESIGNAL_WEB_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ??
  "4a57e90e-433d-465c-a3d1-99d6c1a0c5df";

let oneSignalScriptPromise: Promise<void> | null = null;
let oneSignalInitPromise: Promise<OneSignalWebSdk> | null = null;

export function isOneSignalConfigured() {
  return Boolean(ONESIGNAL_WEB_APP_ID);
}

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

export async function getOneSignal(userId?: string) {
  if (!ONESIGNAL_WEB_APP_ID) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID is not configured.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  const existingInitPromise =
    oneSignalInitPromise ?? window.__oneSignalInitPromise;

  if (existingInitPromise) {
    const oneSignal = await existingInitPromise;
    if (userId) await oneSignal.login(userId);
    return oneSignal;
  }

  window.OneSignalDeferred = window.OneSignalDeferred ?? [];
  await loadOneSignalScript();

  oneSignalInitPromise = runWhenOneSignalReady(async (oneSignal) => {
    await oneSignal.init({
      appId: ONESIGNAL_WEB_APP_ID,
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

    window.__oneSignalInitialized = true;
    if (userId) await oneSignal.login(userId);
    return oneSignal;
  });

  return oneSignalInitPromise;
}
