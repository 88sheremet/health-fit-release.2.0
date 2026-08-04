export const routes = {
  onboarding: {
    screening: "/screening",
    questions: "/questions",
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
  },
} as const;
