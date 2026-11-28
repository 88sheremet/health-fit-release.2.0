import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type Ref } from "vue";

import { usePushNotifications } from "~/composables/usePushNotifications";
import { useRuntimeConfig, useSupabaseClient } from "../setup";

const VAPID_KEY = "dGVzdC12YXBpZC1rZXk";
const VAPID_BYTES = new Uint8Array(Buffer.from("test-vapid-key", "utf8"));

type Permission = "default" | "granted" | "denied";
type QueryResult = { data: any; error: any };

const state = new Map<string, Ref<any>>();

function createChain(result: QueryResult = { data: null, error: null }) {
  const chain: any = Promise.resolve(result);

  ["select", "eq", "delete", "upsert"].forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  chain.single = vi.fn().mockResolvedValue(result);

  return chain;
}

function createSupabaseMock(
  options: {
    user?: any;
    userError?: any;
    notificationSettings?: QueryResult;
    upsertError?: any;
    subscriptionUpsertError?: any;
    deleteError?: any;
  } = {},
) {
  const settingsChain = createChain(options.notificationSettings);
  const upsertSettings = vi
    .fn()
    .mockResolvedValue({ error: options.upsertError ?? null });
  settingsChain.upsert = upsertSettings;

  const subscriptionsChain = createChain();
  const upsertSubscription = vi
    .fn()
    .mockResolvedValue({ error: options.subscriptionUpsertError ?? null });
  const deleteSubscription = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: options.deleteError ?? null }),
    }),
  });
  subscriptionsChain.upsert = upsertSubscription;
  subscriptionsChain.delete = deleteSubscription;

  const getUser = vi.fn().mockResolvedValue({
    data: { user: options.user === undefined ? { id: "u1" } : options.user },
    error: options.userError ?? null,
  });

  const from = vi.fn((table: string) => {
    if (table === "notification_settings") return settingsChain;
    if (table === "push_subscriptions") return subscriptionsChain;

    throw new Error(`Unexpected table: ${table}`);
  });

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: { getUser },
    from,
  } as any);

  return {
    getUser,
    from,
    settingsChain,
    subscriptionsChain,
    upsertSettings,
    upsertSubscription,
    deleteSubscription,
  };
}

let permission: Permission;
let requestPermission: ReturnType<typeof vi.fn>;
let serviceWorker: any;
let registration: any;
let subscription: any;

function makeSubscription() {
  return {
    endpoint: "https://push.example/sub-1",
    expirationTime: 1700000000000,
    toJSON: vi.fn().mockReturnValue({
      keys: { p256dh: "p256dh-key", auth: "auth-key" },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

function setupBrowser(
  options: {
    supported?: boolean;
    permission?: Permission;
    requestPermissionResult?: Permission;
    subscription?: any;
    registration?: any;
  } = {},
) {
  const supported = options.supported ?? true;

  permission = options.permission ?? "default";
  subscription = "subscription" in options ? options.subscription : null;
  registration =
    options.registration === undefined
      ? {
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(subscription),
            subscribe: vi.fn().mockResolvedValue(makeSubscription()),
          },
        }
      : options.registration;

  requestPermission = vi.fn(async () => {
    permission = options.requestPermissionResult ?? "granted";
    return permission;
  });

  const notification = {
    get permission() {
      return permission;
    },
    requestPermission,
  };

  serviceWorker = {
    register: vi.fn().mockResolvedValue(registration),
    getRegistration: vi.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  };

  const navigatorMock: Record<string, any> = { userAgent: "vitest-agent" };
  const windowMock: Record<string, any> = {};

  if (supported) {
    navigatorMock.serviceWorker = serviceWorker;
    windowMock.PushManager = class PushManager {};
    windowMock.Notification = notification;
  }

  vi.stubGlobal("navigator", navigatorMock);
  vi.stubGlobal("window", windowMock);
  vi.stubGlobal("Notification", notification);
  vi.stubGlobal(
    "atob",
    (value: string) => Buffer.from(value, "base64").toString("binary"),
  );
}

beforeEach(() => {
  state.clear();
  vi.clearAllMocks();

  vi.stubGlobal("computed", computed);
  vi.stubGlobal("useState", (key: string, init: () => any) => {
    if (!state.has(key)) state.set(key, ref(init()));
    return state.get(key)!;
  });

  vi.mocked(useRuntimeConfig).mockReturnValue({
    public: { vapidPublicKey: VAPID_KEY },
  } as any);

  setupBrowser();
  createSupabaseMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("usePushNotifications", () => {
  describe("isSupported", () => {
    it("is true when service worker, PushManager and Notification exist", () => {
      expect(usePushNotifications().isSupported.value).toBe(true);
    });

    it("is false without service worker support", () => {
      setupBrowser({ supported: false });

      expect(usePushNotifications().isSupported.value).toBe(false);
    });

    it("is false without PushManager", () => {
      setupBrowser();
      delete (globalThis as any).window.PushManager;

      expect(usePushNotifications().isSupported.value).toBe(false);
    });

    it("is false without Notification API", () => {
      setupBrowser();
      delete (globalThis as any).window.Notification;

      expect(usePushNotifications().isSupported.value).toBe(false);
    });
  });

  describe("loadSettings", () => {
    it("rejects in unsupported browsers", async () => {
      setupBrowser({ supported: false });

      await expect(usePushNotifications().loadSettings()).rejects.toThrow(
        "Браузер не поддерживает Push-уведомления",
      );
    });

    it("propagates auth errors", async () => {
      const error = new Error("auth failed");
      createSupabaseMock({ userError: error });

      await expect(usePushNotifications().loadSettings()).rejects.toBe(error);
    });

    it("rejects unauthenticated users", async () => {
      createSupabaseMock({ user: null });

      await expect(usePushNotifications().loadSettings()).rejects.toThrow(
        "Пользователь не авторизован",
      );
    });

    it("loads saved settings, permission and subscription state", async () => {
      const currentSubscription = makeSubscription();
      setupBrowser({ permission: "granted", subscription: currentSubscription });
      createSupabaseMock({
        notificationSettings: {
          data: {
            enabled: true,
            reminder_time: "08:45:00+00",
            days_of_week: [1, 3, 5],
            timezone: "Europe/Kyiv",
          },
          error: null,
        },
      });

      const notifications = usePushNotifications();
      await notifications.loadSettings();

      expect(notifications.settings.value).toEqual({
        enabled: true,
        reminder_time: "08:45",
        days_of_week: [1, 3, 5],
        timezone: "Europe/Kyiv",
      });
      expect(notifications.permission.value).toBe("granted");
      expect(notifications.isSubscribed.value).toBe(true);
      expect(serviceWorker.getRegistration).toHaveBeenCalledWith("/");
    });

    it("schedules a local reminder when the page stays open", async () => {
      setupBrowser({ permission: "granted" });

      const setTimeoutSpy = vi.fn().mockReturnValue(1);
      const clearTimeoutSpy = vi.fn();

      Object.assign(globalThis.window, {
        setTimeout: setTimeoutSpy,
        clearTimeout: clearTimeoutSpy,
      });

      const future = new Date(Date.now() + 60_000);
      const reminderTime = `${String(future.getHours()).padStart(2, "0")}:${String(
        future.getMinutes(),
      ).padStart(2, "0")}`;

      createSupabaseMock({
        notificationSettings: {
          data: {
            enabled: true,
            reminder_time: reminderTime,
            days_of_week: [1, 2, 3, 4, 5, 6, 7],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          },
          error: null,
        },
      });

      await usePushNotifications().loadSettings();

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy.mock.calls[0][1]).toBeGreaterThan(0);
    });

    it("uses defaults with the browser timezone when no row exists", async () => {
      const timezoneSpy = vi
        .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
        .mockReturnValue({ timeZone: "America/New_York" } as any);
      setupBrowser({ registration: null });

      const notifications = usePushNotifications();
      await notifications.loadSettings();

      expect(notifications.settings.value).toEqual({
        enabled: false,
        reminder_time: "09:30",
        days_of_week: [1, 2, 3, 4, 5, 6],
        timezone: "America/New_York",
      });
      expect(notifications.isSubscribed.value).toBe(false);

      timezoneSpy.mockRestore();
    });

    it("propagates settings query errors", async () => {
      const error = new Error("select failed");
      createSupabaseMock({
        notificationSettings: { data: null, error },
      });

      await expect(usePushNotifications().loadSettings()).rejects.toBe(error);
    });
  });

  describe("updateSchedule", () => {
    it.each(["9:30", "25:00", "09:60", "09:30:00", "ab:cd"])(
      "rejects invalid time %s",
      async (time) => {
        await expect(
          usePushNotifications().updateSchedule(time, [1]),
        ).rejects.toThrow("Некорректное время уведомления");
      },
    );

    it.each([
      [0],
      [8],
      [1.5],
      [Number.NaN],
      [1, 9],
    ])("rejects invalid days %s", async (...days) => {
      await expect(
        usePushNotifications().updateSchedule("09:30", days as number[]),
      ).rejects.toThrow("Некорректные дни недели");
    });

    it("upserts sorted unique days and updates local settings", async () => {
      const { upsertSettings } = createSupabaseMock();

      await usePushNotifications().updateSchedule("07:05", [6, 1, 6, 3]);

      expect(upsertSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "u1",
          reminder_time: "07:05",
          days_of_week: [1, 3, 6],
        }),
        { onConflict: "user_id" },
      );

      const push = usePushNotifications();
      expect(push.settings.value.reminder_time).toBe("07:05");
      expect(push.settings.value.days_of_week).toEqual([1, 3, 6]);
    });

    it("shows the reminder immediately when the saved time has already passed", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 10, 28, 13, 14, 0));

      setupBrowser({ permission: "granted" });
      const showNotification = vi.fn().mockResolvedValue(undefined);
      registration.showNotification = showNotification;

      createSupabaseMock({
        notificationSettings: {
          data: {
            enabled: true,
            reminder_time: "13:13",
            days_of_week: [1, 2, 3, 4, 5, 6, 7],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          },
          error: null,
        },
      });

      const push = usePushNotifications();
      await push.loadSettings();

      await expect(
        push.updateSchedule("13:13", [1, 2, 3, 4, 5, 6, 7]),
      ).resolves.toBe(true);

      expect(showNotification).toHaveBeenCalledWith(
        "Health Fit",
        expect.objectContaining({ body: expect.any(String) }),
      );
    });

    it("propagates upsert errors without changing local settings", async () => {
      const error = new Error("upsert failed");
      createSupabaseMock({ upsertError: error });

      const push = usePushNotifications();

      await expect(push.updateSchedule("10:00", [2])).rejects.toBe(error);
      expect(push.settings.value.reminder_time).toBe("09:30");
    });
  });

  describe("enableNotifications", () => {
    it("rejects when VAPID key is missing", async () => {
      vi.mocked(useRuntimeConfig).mockReturnValue({
        public: { vapidPublicKey: "" },
      } as any);

      await expect(
        usePushNotifications().enableNotifications(),
      ).rejects.toThrow("Не указан VAPID Public Key");
      expect(requestPermission).not.toHaveBeenCalled();
    });

    it("rejects when the browser denies permission", async () => {
      setupBrowser({ permission: "denied" });

      await expect(
        usePushNotifications().enableNotifications(),
      ).rejects.toThrow("Браузер не разрешил отправку уведомлений");
      expect(serviceWorker.register).not.toHaveBeenCalled();
      expect(usePushNotifications().permission.value).toBe("denied");
    });

    it("registers the worker, subscribes and persists subscription and settings", async () => {
      const { upsertSubscription, upsertSettings } = createSupabaseMock();
      const currentSubscription = makeSubscription();
      registration.pushManager.subscribe.mockResolvedValue(currentSubscription);

      const push = usePushNotifications();

      await expect(push.enableNotifications()).resolves.toBe(true);

      expect(requestPermission).toHaveBeenCalledOnce();
      expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js", {
        scope: "/",
      });
      expect(registration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: VAPID_BYTES,
      });
      expect(upsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "u1",
          endpoint: currentSubscription.endpoint,
          p256dh: "p256dh-key",
          auth: "auth-key",
          expiration_time: new Date(1700000000000).toISOString(),
          user_agent: "vitest-agent",
        }),
        { onConflict: "endpoint" },
      );
      expect(upsertSettings).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
        { onConflict: "user_id" },
      );
      expect(push.isSubscribed.value).toBe(true);
      expect(push.settings.value.enabled).toBe(true);
    });

    it("shows a confirmation notification after a successful enable", async () => {
      const showNotification = vi.fn().mockResolvedValue(undefined);
      registration.showNotification = showNotification;

      await usePushNotifications().enableNotifications();

      expect(showNotification).toHaveBeenCalledWith(
        "Health Fit",
        expect.objectContaining({
          body: expect.stringContaining("Push-уведомления включены"),
          data: { url: "/daily" },
        }),
      );
    });

    it("reuses an existing subscription", async () => {
      const existing = makeSubscription();
      registration.pushManager.getSubscription.mockResolvedValue(existing);

      await usePushNotifications().enableNotifications();

      expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
      expect(usePushNotifications().isSubscribed.value).toBe(true);
    });

    it("rejects subscriptions without keys", async () => {
      registration.pushManager.subscribe.mockResolvedValue({
        endpoint: "https://push.example/no-keys",
        toJSON: () => ({ keys: undefined }),
      });

      await expect(
        usePushNotifications().enableNotifications(),
      ).rejects.toThrow("Не удалось получить ключи Push-подписки");
    });

    it("propagates subscription persistence errors", async () => {
      const error = new Error("subscription upsert failed");
      registration.pushManager.subscribe.mockResolvedValue(makeSubscription());
      createSupabaseMock({ subscriptionUpsertError: error });

      const push = usePushNotifications();

      await expect(push.enableNotifications()).rejects.toBe(error);
      expect(push.isSubscribed.value).toBe(false);
    });
  });

  describe("disableNotifications", () => {
    it("saves disabled settings, deletes the subscription and unsubscribes", async () => {
      const currentSubscription = makeSubscription();
      setupBrowser({ subscription: currentSubscription });
      const { upsertSettings, deleteSubscription } = createSupabaseMock();

      const push = usePushNotifications();
      await push.disableNotifications();

      expect(upsertSettings).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
        { onConflict: "user_id" },
      );
      expect(deleteSubscription).toHaveBeenCalled();
      expect(currentSubscription.unsubscribe).toHaveBeenCalledOnce();
      expect(push.isSubscribed.value).toBe(false);
    });

    it("still disables settings when no registration exists", async () => {
      setupBrowser({ registration: null });
      const { deleteSubscription } = createSupabaseMock();

      await usePushNotifications().disableNotifications();

      expect(deleteSubscription).not.toHaveBeenCalled();
      expect(usePushNotifications().settings.value.enabled).toBe(false);
    });

    it("does not unsubscribe when deleting the subscription fails", async () => {
      const currentSubscription = makeSubscription();
      setupBrowser({ subscription: currentSubscription });
      createSupabaseMock({ deleteError: new Error("delete failed") });

      await expect(
        usePushNotifications().disableNotifications(),
      ).rejects.toThrow("delete failed");
      expect(currentSubscription.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe("sendTestNotification", () => {
    it("shows a notification with the provided body when permission is granted", async () => {
      setupBrowser({ permission: "granted" });
      const showNotification = vi.fn().mockResolvedValue(undefined);
      registration.showNotification = showNotification;

      const result = await usePushNotifications().sendTestNotification(
        "Тестовое уведомление",
      );

      expect(result).toBe(true);
      expect(showNotification).toHaveBeenCalledWith(
        "Health Fit",
        expect.objectContaining({ body: "Тестовое уведомление" }),
      );
    });

    it("does nothing when permission is denied", async () => {
      setupBrowser({ permission: "denied" });
      const showNotification = vi.fn();
      registration.showNotification = showNotification;

      const result = await usePushNotifications().sendTestNotification();

      expect(result).toBe(false);
      expect(showNotification).not.toHaveBeenCalled();
    });
  });
});
