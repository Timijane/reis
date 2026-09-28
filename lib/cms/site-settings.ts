import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ColorMode = "solid" | "gradient";
export type GradientDirection =
  | "to right"
  | "to left"
  | "to bottom"
  | "to top"
  | "to bottom right"
  | "to bottom left"
  | "to top right"
  | "to top left"
  | "radial";

export interface ColorSetting {
  mode: ColorMode;
  color: string;
  colors: string[];
  direction: GradientDirection;
}

export interface SiteColors {
  primary: ColorSetting;
  secondary: ColorSetting;
  accent: ColorSetting;

  background: ColorSetting;
  surface: ColorSetting;

  text: ColorSetting;
  mutedText: ColorSetting;

  headline: ColorSetting;
  announcement: ColorSetting;

  headerBackground: ColorSetting;
  headerText: ColorSetting;

  footerBackground: ColorSetting;
  footerText: ColorSetting;

  buttonBackground: ColorSetting;
  buttonText: ColorSetting;

  border: ColorSetting;
}

export interface SiteSettings {
  colors: SiteColors;
  universalColorsEnabled: boolean;
  logoUrl: string;
  siteName: string;
  siteTagline: string;
  fontHeading: string;
  fontBody: string;
}

export const COLOR_PALETTE = [
  "#FFFFFF",
  "#F8F6F0",
  "#F3EFE6",
  "#E9E2D3",
  "#D8CDBB",
  "#C5B8A4",
  "#AFA18D",
  "#8F8576",
  "#70695F",
  "#4E4A44",
  "#292724",
  "#111111",
  "#E7D8B9",
  "#C9A96E",
  "#A98245",
  "#806333",
  "#5F4724",
  "#DDE5D5",
  "#B7C6A5",
  "#8FA17B",
  "#6F8060",
  "#4D6244",
  "#344936",
  "#203326",
  "#DCE8E6",
  "#AFCAC6",
  "#789F9A",
  "#4D7772",
  "#315B58",
  "#203F3D",
  "#DCE4F0",
  "#AEBED5",
  "#7D96B5",
  "#526F92",
  "#344F70",
  "#213853",
  "#E7DDF0",
  "#C6B2D9",
  "#9B7DB5",
  "#76578F",
  "#543C6B",
  "#382847",
  "#F0D9D4",
  "#D7AAA2",
  "#B9786E",
  "#944E46",
  "#703832",
  "#4A2522",
] as const;

function solid(color: string): ColorSetting {
  return {
    mode: "solid",
    color,
    colors: [color],
    direction: "to right",
  };
}

export const defaultSiteSettings: SiteSettings = {
  colors: {
    primary: solid("#1f1f1c"),
    secondary: solid("#6f7565"),
    accent: solid("#9b8061"),

    background: solid("#f7f5ef"),
    surface: solid("#efede6"),

    text: solid("#24231f"),
    mutedText: solid("#77756d"),

    headline: solid("#1f1f1c"),
    announcement: solid("#1f1f1c"),

    headerBackground: solid("#faf9f6"),
    headerText: solid("#1f1f1c"),

    footerBackground: solid("#1f1f1c"),
    footerText: solid("#f5f3ed"),

    buttonBackground: solid("#1f1f1c"),
    buttonText: solid("#ffffff"),

    border: solid("#d8d5cc"),
  },

  universalColorsEnabled: true,

  logoUrl: "",

  siteName: "REIS EVENT",
  siteTagline: "SERVICES",

  fontHeading: "Playfair Display",
  fontBody: "Inter",
};

const settingsRef = doc(db, "siteContent", "settings");

export async function getSiteSettings(): Promise<SiteSettings> {
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return defaultSiteSettings;
  }

  const data = snapshot.data() as Partial<SiteSettings>;

  return {
    ...defaultSiteSettings,
    ...data,
    colors: {
      ...defaultSiteSettings.colors,
      ...(data.colors ?? {}),
    },
  };
}

export async function saveSiteSettings(
  settings: SiteSettings
): Promise<void> {
  await setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
