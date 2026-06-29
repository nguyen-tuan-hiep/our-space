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
  }): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
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
      optOut(): Promise<void>;
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
    OneSignal?: OneSignalWebSdk;
    OneSignalDeferred?: OneSignalDeferredQueue;
    __oneSignal?: OneSignalWebSdk;
    __oneSignalInitPromise?: Promise<OneSignalWebSdk>;
    __oneSignalInitialized?: boolean;
  }
}

export const ONESIGNAL_WEB_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ??
  "d27ba552-6618-4673-9914-6cb8e637d287";

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
      notifyButton: { enable: true },
    });

    window.OneSignal = oneSignal;
    window.__oneSignal = oneSignal;
    window.__oneSignalInitialized = true;
    if (userId) await oneSignal.login(userId);
    return oneSignal;
  });

  return oneSignalInitPromise;
}

export async function logoutOneSignal() {
  if (!isOneSignalConfigured()) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const oneSignal = await getOneSignal();
  await oneSignal.logout();
}
