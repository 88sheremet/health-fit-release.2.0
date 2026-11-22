export interface ScreeningScoreRow {
  physical_score: number | string | null;
  food_score: number | string | null;
  mind_score: number | string | null;
}

export type ScreeningChangeStatus = "improved" | "declined" | "unchanged";

export interface ScoreComparison {
  key: "physical" | "food" | "mind";
  label: string;
  initial: number;
  final: number;
  improvement: number;
  status: ScreeningChangeStatus;
  icon: string;
  changeText: string;
  insight: string;
}

export type ScreeningTranslate = (
  key: string,
  values?: Record<string, any>
) => string;

export function getTotalScore(row: ScreeningScoreRow | null): number {
  if (!row) return 0;

  return (
    Number(row.physical_score) +
    Number(row.food_score) +
    Number(row.mind_score)
  );
}

export function getChangeStatus(improvement: number): ScreeningChangeStatus {
  if (improvement > 0) return "improved";
  if (improvement < 0) return "declined";
  return "unchanged";
}

export function getChangeIcon(status: ScreeningChangeStatus): string {
  if (status === "improved") return "trending_down";
  if (status === "declined") return "trending_up";
  return "trending_flat";
}

export function getOverallChangeText(
  improvement: number,
  t: ScreeningTranslate
): string {
  const status = getChangeStatus(improvement);

  if (status === "improved") {
    return t("program.overallImproved", { value: improvement });
  }

  if (status === "declined") {
    return t("program.overallDeclined", { value: Math.abs(improvement) });
  }

  return t("program.overallUnchanged");
}

export function getScoreComparisons(
  initial: ScreeningScoreRow | null,
  final: ScreeningScoreRow | null,
  t: ScreeningTranslate
): ScoreComparison[] {
  if (!initial || !final) return [];

  const items = [
    {
      key: "physical" as const,
      label: "program.physical",
      initial: Number(initial.physical_score),
      final: Number(final.physical_score),
    },
    {
      key: "food" as const,
      label: "program.food",
      initial: Number(initial.food_score),
      final: Number(final.food_score),
    },
    {
      key: "mind" as const,
      label: "program.mind",
      initial: Number(initial.mind_score),
      final: Number(final.mind_score),
    },
  ];

  return items.map((item) => {
    const improvement = item.initial - item.final;
    const status = getChangeStatus(improvement);
    const icon = getChangeIcon(status);

    let changeText: string;
    let insight: string;

    if (status === "improved") {
      changeText = t("program.improvedBy", { value: improvement });
      insight = t("program.directionImproved");
    } else if (status === "declined") {
      changeText = t("program.declinedBy", { value: Math.abs(improvement) });
      insight = t("program.directionDeclined");
    } else {
      changeText = t("program.noChange");
      insight = t("program.directionUnchanged");
    }

    return { ...item, improvement, status, icon, changeText, insight };
  });
}
