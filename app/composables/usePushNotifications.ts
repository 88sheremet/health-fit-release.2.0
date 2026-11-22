
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

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
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

  const isSupported = computed(() => {
    if (!import.meta.client) return false;

    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  });

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
  };

  const updateSchedule = async (
    reminderTime: string,
    daysOfWeek: number[],
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

    await saveSettings({
      ...settings.value,
      reminder_time: reminderTime,
      days_of_week: uniqueDays,
      timezone: getBrowserTimezone(),
    });
  };

  const enableNotifications = async () => {
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

  return {
    settings,
    permission,
    isSupported,
    isSubscribed,
    loadSettings,
    updateSchedule,
    enableNotifications,
    disableNotifications,
  };
};
