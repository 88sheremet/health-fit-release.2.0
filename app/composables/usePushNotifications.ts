
type NotificationSettings = {
  enabled: boolean;
  reminder_time: string;
  days_of_week: number[];
  timezone: string;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  reminder_time: "09:30",
  days_of_week: [1, 2, 3, 4, 5, 6],
  timezone: "UTC",
};

const TEST_NOTIFICATION_BODY =
  "Push-уведомления включены. Напоминания будут приходить по расписанию.";
const REMINDER_NOTIFICATION_BODY =
  "Пора уделить немного времени своему здоровью. Твои ежедневные задания ждут тебя!";

let reminderTimer: number | null = null;

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getIsoDay(date: Date): number {
  const day = date.getDay();

  return day === 0 ? 7 : day;
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextReminderDate(time: string, daysOfWeek: number[]): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      hours,
      minutes,
      0,
      0,
    );

    if (candidate <= now) continue;
    if (daysOfWeek.includes(getIsoDay(candidate))) return candidate;
  }

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

export const usePushNotifications = () => {
  const supabase = useSupabaseClient();
  const config = useRuntimeConfig();

  const settings = useState<NotificationSettings>(
    "push-notification-settings",
    () => ({ ...DEFAULT_SETTINGS }),
  );

  const permission = useState<NotificationPermission>(
    "push-notification-permission",
    () => "default",
  );

  const isSubscribed = useState<boolean>(
    "push-notification-subscribed",
    () => false,
  );

  const nextReminderAt = useState<string | null>(
    "push-notification-next-reminder",
    () => null,
  );

  const lastNotificationShown = useState<boolean | null>(
    "push-notification-last-shown",
    () => null,
  );

  const lastReminderFiredAt = useState<number | null>(
    "push-notification-last-reminder-at",
    () => null,
  );

  const lastReminderShown = useState<boolean | null>(
    "push-notification-last-reminder-shown",
    () => null,
  );

  const canShowNotifications = computed(() => {
    if (!import.meta.client) return false;

    return "serviceWorker" in navigator && "Notification" in window;
  });

  const isSupported = computed(() => {
    if (!import.meta.client) return false;

    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  });

  const clearLocalReminder = () => {
    nextReminderAt.value = null;

    if (
      reminderTimer !== null &&
      typeof window !== "undefined" &&
      typeof window.clearTimeout === "function"
    ) {
      window.clearTimeout(reminderTimer);
    }

    reminderTimer = null;
  };

  const scheduleLocalReminder = async () => {
    clearLocalReminder();

    if (
      !import.meta.client ||
      typeof window === "undefined" ||
      typeof window.setTimeout !== "function" ||
      !canShowNotifications.value ||
      permission.value !== "granted" ||
      !settings.value.enabled ||
      settings.value.timezone !== getBrowserTimezone() ||
      !settings.value.days_of_week.length
    ) {
      return;
    }

    const nextDate = getNextReminderDate(
      settings.value.reminder_time,
      settings.value.days_of_week,
    );

    if (!nextDate) return;

    const delay = nextDate.getTime() - Date.now();

    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return;

    nextReminderAt.value = nextDate.toLocaleString();

    reminderTimer = window.setTimeout(async () => {
      reminderTimer = null;

      try {
        const user = await getCurrentUser();

        const { data } = await supabase
          .from("notification_settings")
          .select("last_sent_local_date")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.last_sent_local_date === getLocalDateString(new Date())) {
          await scheduleLocalReminder();
          return;
        }
      } catch (error) {
        console.warn("Could not check pushed reminders:", error);
      }

      try {
        const shown = await sendTestNotification(REMINDER_NOTIFICATION_BODY);

        lastReminderShown.value = shown;
      } catch (error) {
        console.warn("Could not show local reminder:", error);

        lastReminderShown.value = false;
      }

      lastReminderFiredAt.value = Date.now();

      await scheduleLocalReminder();
    }, delay) as unknown as number;
  };

  const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!data.user) throw new Error("Пользователь не авторизован");

    return data.user;
  };

  const loadSettings = async () => {
    if (!import.meta.client) return;

    if (!isSupported.value) {
      throw new Error("Браузер не поддерживает Push-уведомления");
    }

    const user = await getCurrentUser();

    permission.value = Notification.permission;

    const { data, error } = await supabase
      .from("notification_settings")
      .select("enabled, reminder_time, days_of_week, timezone")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      settings.value = {
        enabled: data.enabled,
        reminder_time: data.reminder_time.slice(0, 5),
        days_of_week: data.days_of_week,
        timezone: data.timezone,
      };
    } else {
      settings.value = {
        ...DEFAULT_SETTINGS,
        timezone: getBrowserTimezone(),
      };
    }

    const registration = await navigator.serviceWorker.getRegistration("/");

    if (registration) {
      const subscription =
        await registration.pushManager.getSubscription();

      isSubscribed.value = !!subscription;
    } else {
      isSubscribed.value = false;
    }

    await scheduleLocalReminder();
  };

  const saveSettings = async (
    newSettings: NotificationSettings,
  ) => {
    const user = await getCurrentUser();

    const payload = {
      user_id: user.id,
      enabled: newSettings.enabled,
      reminder_time: newSettings.reminder_time,
      days_of_week: [...newSettings.days_of_week].sort((a, b) => a - b),
      timezone: newSettings.timezone,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("notification_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) throw error;

    settings.value = {
      ...payload,
      days_of_week: payload.days_of_week,
    };

    await scheduleLocalReminder();
  };

  const updateSchedule = async (
    reminderTime: string,
    daysOfWeek: number[],
    reminderBody: string = REMINDER_NOTIFICATION_BODY,
  ) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) {
      throw new Error("Некорректное время уведомления");
    }

    if (
      daysOfWeek.some(
        (day) => !Number.isInteger(day) || day < 1 || day > 7,
      )
    ) {
      throw new Error("Некорректные дни недели");
    }

    const uniqueDays = [...new Set(daysOfWeek)];
    const wasEnabled = settings.value.enabled;

    await saveSettings({
      ...settings.value,
      reminder_time: reminderTime,
      days_of_week: uniqueDays,
      timezone: getBrowserTimezone(),
    });

    if (!wasEnabled) return false;

    const now = new Date();
    const [hours, minutes] = reminderTime.split(":").map(Number);
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0,
    );

    if (today > now || !uniqueDays.includes(getIsoDay(now))) return false;

    return await sendTestNotification(reminderBody);
  };

  const enableNotifications = async (
    testBody: string = TEST_NOTIFICATION_BODY,
  ) => {
    if (!import.meta.client || !isSupported.value) {
      throw new Error("Push-уведомления не поддерживаются");
    }

    if (!config.public.vapidPublicKey) {
      throw new Error("Не указан VAPID Public Key");
    }

    const user = await getCurrentUser();

    // Запрашиваем разрешение только после действия пользователя.
    let currentPermission = Notification.permission;

    if (currentPermission === "default") {
      currentPermission = await Notification.requestPermission();
    }

    permission.value = currentPermission;

    if (currentPermission !== "granted") {
      throw new Error("Браузер не разрешил отправку уведомлений");
    }

    // Регистрируем Service Worker.
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    await navigator.serviceWorker.ready;

    // Получаем существующую подписку или создаём новую.
    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          config.public.vapidPublicKey,
        ) as BufferSource,
      });
    }

    const subscriptionData = subscription.toJSON();

    const p256dh = subscriptionData.keys?.p256dh;
    const auth = subscriptionData.keys?.auth;

    if (!p256dh || !auth) {
      throw new Error("Не удалось получить ключи Push-подписки");
    }

    // Сохраняем подписку текущего пользователя.
    const { error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          expiration_time: subscription.expirationTime
            ? new Date(subscription.expirationTime).toISOString()
            : null,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

    if (subscriptionError) throw subscriptionError;

    // Сохраняем настройки расписания.
    await saveSettings({
      ...settings.value,
      enabled: true,
      timezone: getBrowserTimezone(),
    });

    isSubscribed.value = true;
    permission.value = Notification.permission;

    try {
      await sendTestNotification(testBody);
    } catch (error) {
      console.warn("Could not show confirmation notification:", error);
    }

    return true;
  };

  const disableNotifications = async () => {
    if (!import.meta.client) return;

    const user = await getCurrentUser();

    // Сначала отключаем отправку на уровне настроек.
    await saveSettings({
      ...settings.value,
      enabled: false,
    });

    const registration = await navigator.serviceWorker.getRegistration("/");

    if (registration) {
      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        const { error } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);

        if (error) throw error;

        await subscription.unsubscribe();
      }
    }

    isSubscribed.value = false;
  };

  const showNotification = async (body: string) => {
    if (!import.meta.client || !canShowNotifications.value) return false;

    permission.value = Notification.permission;

    if (permission.value !== "granted") return false;

    const options = {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "health-fit-reminder",
      renotify: true,
      requireInteraction: true,
      data: {
        url: "/daily",
      },
    } as NotificationOptions & { renotify?: boolean };

    const showViaRegistration = async (
      candidate: ServiceWorkerRegistration | null | undefined,
    ) => {
      if (!candidate || typeof candidate.showNotification !== "function") {
        return false;
      }

      try {
        await candidate.showNotification("Health Fit", options);

        return true;
      } catch (error) {
        console.warn("Service worker notification failed:", error);

        return false;
      }
    };

    const registration =
      await navigator.serviceWorker.getRegistration("/");

    if (await showViaRegistration(registration)) return true;

    try {
      if (await showViaRegistration(await navigator.serviceWorker.ready)) {
        return true;
      }
    } catch (error) {
      console.warn("Service worker is not ready:", error);
    }

    try {
      const newRegistration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      if (await showViaRegistration(newRegistration)) return true;
    } catch (error) {
      console.warn("Could not register service worker:", error);
    }

    try {
      const notification = new Notification("Health Fit", options);

      notification.onclick = () => {
        window.focus();
      };

      return true;
    } catch (error) {
      console.warn("Browser notification failed:", error);

      return false;
    }
  };

  const sendTestNotification = async (
    body: string = TEST_NOTIFICATION_BODY,
  ) => {
    const shown = await showNotification(body);

    lastNotificationShown.value = shown;

    return shown;
  };

  return {
    settings,
    permission,
    isSupported,
    canShowNotifications,
    isSubscribed,
    nextReminderAt,
    lastNotificationShown,
    lastReminderFiredAt,
    lastReminderShown,
    loadSettings,
    updateSchedule,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
  };
};
