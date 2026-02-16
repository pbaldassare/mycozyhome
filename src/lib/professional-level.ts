import { Award, Medal, Trophy, Crown } from "lucide-react";

export type ProfessionalLevel = "bronze" | "silver" | "gold" | "platinum";

interface LevelInfo {
  level: ProfessionalLevel;
  label: string;
  icon: typeof Award;
  colorClass: string;
  bgClass: string;
}

/**
 * Calculates professional level based on average rating and years of experience.
 * Score = (rating * 10) + (years * 5) + (reviewCount * 0.5)
 * Bronze: 0-29 | Silver: 30-49 | Gold: 50-69 | Platinum: 70+
 */
export function getProfessionalLevel(
  averageRating: number = 0,
  yearsExperience: number = 0,
  reviewCount: number = 0
): LevelInfo {
  const score =
    averageRating * 10 + yearsExperience * 5 + reviewCount * 0.5;

  if (score >= 70) {
    return {
      level: "platinum",
      label: "Platino",
      icon: Crown,
      colorClass: "text-violet-600 dark:text-violet-400",
      bgClass: "bg-violet-100 dark:bg-violet-900/30",
    };
  }
  if (score >= 50) {
    return {
      level: "gold",
      label: "Oro",
      icon: Trophy,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-100 dark:bg-amber-900/30",
    };
  }
  if (score >= 30) {
    return {
      level: "silver",
      label: "Argento",
      icon: Medal,
      colorClass: "text-slate-500 dark:text-slate-300",
      bgClass: "bg-slate-100 dark:bg-slate-800/40",
    };
  }
  return {
    level: "bronze",
    label: "Bronzo",
    icon: Award,
    colorClass: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
  };
}
