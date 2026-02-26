export type ThemeId = "mono" | "warm" | "morandiBlue" | "morandiGreen" | "morandiPink" | "morandiOlive";

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    bg: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentFg: string;
    indicator: string;
    border: string;
    muted: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  mono: {
    id: "mono",
    name: "云朵 (白)",
    colors: {
      bg: "#fafafa", // neutral-50
      card: "#ffffff",
      textPrimary: "#525252", // neutral-600
      textSecondary: "#a3a3a3", // neutral-400
      accent: "#737373", // neutral-500
      accentFg: "#ffffff",
      indicator: "#d4d4d4", // neutral-300
      border: "#f5f5f5", // neutral-100
      muted: "#fafafa",
    },
  },
  warm: {
    id: "warm",
    name: "拿铁 (咖)",
    colors: {
      bg: "#fdf8f6", // very light warm grey/brown
      card: "#ffffff",
      textPrimary: "#5d4037", // brown-800
      textSecondary: "#a1887f", // brown-300
      accent: "#8d6e63", // brown-400
      accentFg: "#ffffff",
      indicator: "#d7ccc8", // brown-100
      border: "#efebe9", // brown-50
      muted: "#fdf8f6",
    },
  },
  morandiBlue: {
    id: "morandiBlue",
    name: "雾霾 (蓝)",
    colors: {
      bg: "#EBF0F3",
      card: "#ffffff",
      textPrimary: "#4A5568",
      textSecondary: "#8E9AAF",
      accent: "#7B8C9E",
      accentFg: "#ffffff",
      indicator: "#B0C4DE",
      border: "#DDE1E7",
      muted: "#F5F7FA",
    },
  },
  morandiGreen: {
    id: "morandiGreen",
    name: "豆沙 (绿)",
    colors: {
      bg: "#F2F5F0",
      card: "#ffffff",
      textPrimary: "#4F5D54",
      textSecondary: "#8F9E93",
      accent: "#7A8B80",
      accentFg: "#ffffff",
      indicator: "#B5C2B9",
      border: "#E0E6E2",
      muted: "#F7FAF8",
    },
  },
  morandiPink: {
    id: "morandiPink",
    name: "烟灰 (粉)",
    colors: {
      bg: "#F9F3F3",
      card: "#ffffff",
      textPrimary: "#6D5A5A",
      textSecondary: "#C5A8A8",
      accent: "#B09090",
      accentFg: "#ffffff",
      indicator: "#DBC4C4",
      border: "#EBE0E0",
      muted: "#FCF8F8",
    },
  },
  morandiOlive: {
    id: "morandiOlive",
    name: "香芋 (紫)",
    colors: {
      bg: "#F5F3F7",
      card: "#ffffff",
      textPrimary: "#5E5466",
      textSecondary: "#9E94A8",
      accent: "#8E8499",
      accentFg: "#ffffff",
      indicator: "#C9C0D1",
      border: "#E8E4EB",
      muted: "#F9F7FA",
    },
  },
};
