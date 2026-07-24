import { createI18n } from "vue-i18n";

import ru from "./ru";
import uk from "./uk";

const i18n = createI18n({
  legacy: false,

  locale: "ru",

  fallbackLocale: "ru",

  messages: {
    ru,
    uk,
  },
});

export default i18n;