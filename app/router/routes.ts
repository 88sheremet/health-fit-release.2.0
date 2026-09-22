export const routes = {
  onboarding: {
    screening: "/screening",
    questions: "/questions",
    welcome: "/welcome",
  },
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },
  results: {
    physical: "/physical-result",
    food: "/food-result",
    mind: "/mind-result",
  },
  recovery: {
    menu: "/menu",
    daily: "/daily",
    weekly: "/weekly",
    journal: "/journal",
    journalArchive: "/journal-archive",
    journalChart: "/journal-chart",
  },
  settings: "/settings",
} as const;
