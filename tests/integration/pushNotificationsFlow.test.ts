import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, type Ref } from "vue";

import { usePushNotifications } from "~/composables/usePushNotifications";
import { useRuntimeConfig, useSupabaseClient } from "../setup";

const VAPID_KEY = "dGVzdC12YXBpZC1rZXk";
const BROWSER_TIMEZONE = "Europe/Kyiv";

type Db = {
  user: any;
  settings: any | null;
  subscriptions: any[];
  failSettingsUpsert: Error | null;
};

const state = new Map<string, Ref<any>>();
let db: Db;
let browserSubscription: any;
let serviceWorker: any;

function createInMemorySupabase() {
  const notificationSettingsChain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({
      data: db.settings ? { ...db.settings } : null,
      error: null,
    })),
    upsert: vi.fn(async (payload: any) => {
      if (db.failSettingsUpsert) {
        return { error: db.failSettingsUpsert };
      }

      db.settings = { ...payload };
      return { error: null };
    }),
  };

  const pushSubscriptionsChain: any = {
    upsert: vi.fn(async (payload: any) => {
      db.subscriptions = db.subscriptions.filter(
        (row) => row.endpoint !== payload.endpoint,
      );
      db.subscriptions.push({ ...payload, id: `sub-${db.subscriptions.length + 1}` });
      return { error: null };
    }),
    delete: vi.fn(() => ({
      eq: vi.fn((column: string, value: string) => ({
        eq: vi.fn(async (secondColumn: string, secondValue: string) => {
          expect(column).toBe("user_id");
          expect(secondColumn).toBe("endpoint");

          db.subscriptions = db.subscriptions.filter(
            (row) => row[column] !== value || row[secondColumn] !== secondValue,
          );

          return { error: null };
        }),
      })),
    })),
  };

  const from = vi.fn((table: string) => {
    if (table === "notification_settings") return notificationSettingsChain;
    if (table === "push_subscriptions") return pushSubscriptionsChain;

    throw new Error(`Unexpected table: ${table}`);
  });

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: db.user },
        error: null,
      })),
    },
    from,
  } as any);

  return { from, notificationSettingsChain, pushSubscriptionsChain };
}

function setupBrowser() {
  browserSubscription = {
    endpoint: "https://push.example/user-1",
    expirationTime: null,
    toJSON: () => ({
      keys: { p256dh: "p256dh-value", auth: "auth-value" },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };

  serviceWorker = {
    register: vi.fn().mockResolvedValue({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(browserSubscription),
        subscribe: vi.fn().mockResolvedValue(browserSubscription),
      },
    }),
    getRegistration: vi.fn().mockResolvedValue({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(browserSubscription),
      },
    }),
    ready: Promise.resolve({}),
  };

  const notification = {
    permission: "default",
    requestPermission: vi.fn(async () => {
      notification.permission = "granted";
      return "granted";
    }),
  };

  vi.stubGlobal("navigator", {
    serviceWorker,
    userAgent: "integration-agent",
  });
  vi.stubGlobal("window", {
    PushManager: class PushManager {},
    Notification: notification,
  });
  vi.stubGlobal("Notification", notification);
  vi.stubGlobal(
    "atob",
    (value: string) => Buffer.from(value, "base64").toString("binary"),
  );

  const timezoneSpy = vi
    .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
    .mockReturnValue({ timeZone: BROWSER_TIMEZONE } as any);

  return timezoneSpy;
}

let timezoneSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  state.clear();
  vi.clearAllMocks();

  db = {
    user: { id: "user-1" },
    settings: null,
    subscriptions: [],
    failSettingsUpsert: null,
  };

  timezoneSpy = setupBrowser();

  vi.stubGlobal("computed", computed);
  vi.stubGlobal("useState", (key: string, init: () => any) => {
    if (!state.has(key)) state.set(key, ref(init()));
    return state.get(key)!;
  });
  vi.mocked(useRuntimeConfig).mockReturnValue({
    public: { vapidPublicKey: VAPID_KEY },
  } as any);

  createInMemorySupabase();
});

afterEach(() => {
  timezoneSpy.mockRestore();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("push notification settings flow", () => {
  it("persists load → schedule → enable → reload → disable across Supabase calls", async () => {
    const push = usePushNotifications();

    await push.loadSettings();

    expect(push.settings.value).toEqual({
      enabled: false,
      reminder_time: "09:30",
      days_of_week: [1, 2, 3, 4, 5, 6],
      timezone: BROWSER_TIMEZONE,
    });

    await push.updateSchedule("07:15", [7, 1, 1, 3]);

    expect(db.settings).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        enabled: false,
        reminder_time: "07:15",
        days_of_week: [1, 3, 7],
        timezone: BROWSER_TIMEZONE,
      }),
    );

    await push.enableNotifications();

    expect(db.settings.enabled).toBe(true);
    expect(db.subscriptions).toEqual([
      expect.objectContaining({
        user_id: "user-1",
        endpoint: browserSubscription.endpoint,
        p256dh: "p256dh-value",
        auth: "auth-value",
        user_agent: "integration-agent",
      }),
    ]);
    expect(push.isSubscribed.value).toBe(true);

    const reloaded = usePushNotifications();
    await reloaded.loadSettings();

    expect(reloaded.settings.value).toEqual({
      enabled: true,
      reminder_time: "07:15",
      days_of_week: [1, 3, 7],
      timezone: BROWSER_TIMEZONE,
    });
    expect(reloaded.isSubscribed.value).toBe(true);

    await reloaded.disableNotifications();

    expect(db.settings.enabled).toBe(false);
    expect(db.subscriptions).toEqual([]);
    expect(browserSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(reloaded.isSubscribed.value).toBe(false);
  });

  it("treats the server row as the source of truth on reload", async () => {
    db.settings = {
      user_id: "user-1",
      enabled: true,
      reminder_time: "22:15:00+03:00",
      days_of_week: [2, 4],
      timezone: "Asia/Tokyo",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const push = usePushNotifications();
    await push.loadSettings();

    expect(push.settings.value).toEqual({
      enabled: true,
      reminder_time: "22:15",
      days_of_week: [2, 4],
      timezone: "Asia/Tokyo",
    });

    await push.updateSchedule("06:00", [2, 4]);

    expect(db.settings).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        timezone: BROWSER_TIMEZONE,
        reminder_time: "06:00",
      }),
    );
    expect(push.settings.value.reminder_time).toBe("06:00");
  });

  it("blocks every write for unauthenticated users", async () => {
    db.user = null;

    const push = usePushNotifications();

    await expect(push.loadSettings()).rejects.toThrow(
      "Пользователь не авторизован",
    );
    await expect(push.updateSchedule("08:00", [1])).rejects.toThrow(
      "Пользователь не авторизован",
    );
    await expect(push.enableNotifications()).rejects.toThrow(
      "Пользователь не авторизован",
    );
    await expect(push.disableNotifications()).rejects.toThrow(
      "Пользователь не авторизован",
    );

    expect(db.settings).toBeNull();
    expect(db.subscriptions).toEqual([]);
    expect(serviceWorker.register).not.toHaveBeenCalled();
  });

  it("does not write invalid schedules to Supabase", async () => {
    const { from } = createInMemorySupabase();
    const push = usePushNotifications();

    await expect(push.updateSchedule("8:00", [1])).rejects.toThrow(
      "Некорректное время уведомления",
    );
    await expect(push.updateSchedule("08:00", [0])).rejects.toThrow(
      "Некорректные дни недели",
    );

    expect(from).not.toHaveBeenCalledWith("notification_settings");
    expect(db.settings).toBeNull();
  });

  it("keeps the previous settings when a save fails and succeeds on retry", async () => {
    db.settings = {
      user_id: "user-1",
      enabled: false,
      reminder_time: "09:30",
      days_of_week: [1],
      timezone: BROWSER_TIMEZONE,
    };
    db.failSettingsUpsert = new Error("network down");

    const push = usePushNotifications();

    await expect(push.updateSchedule("11:00", [2])).rejects.toThrow(
      "network down",
    );
    expect(push.settings.value.reminder_time).toBe("09:30");
    expect(db.settings.reminder_time).toBe("09:30");

    db.failSettingsUpsert = null;
    await push.updateSchedule("11:00", [2]);

    expect(db.settings.reminder_time).toBe("11:00");
    expect(push.settings.value.days_of_week).toEqual([2]);
  });
});
