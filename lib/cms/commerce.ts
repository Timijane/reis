import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PaymentMethodId =
  | "ukBankTransfer"
  | "stripe"
  | "paypal"
  | "payoneer";

export interface CommercePaymentMethod {
  enabled: boolean;
  configured: boolean;
  displayName: string;
  instructions: string;
  accountName: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  iban: string;
  swiftBic: string;
  publicKey: string;
  merchantId: string;
}

export interface CommercePalette {
  background: string;
  surface: string;
  heading: string;
  text: string;
  muted: string;
  accent: string;
  buttonBackground: string;
  buttonText: string;
}

export interface CommerceDesign {
  inheritHomepagePalette: boolean;
  overrides: Partial<CommercePalette>;
  palette: CommercePalette;
}

export interface CommerceSettings {
  currency: "GBP";
  payments: Record<PaymentMethodId, CommercePaymentMethod>;
  design: CommerceDesign;
  updatedAt?: unknown;
}

export const defaultCommerceSettings: CommerceSettings = {
  currency: "GBP",

  payments: {
    ukBankTransfer: {
      enabled: true,
      configured: false,
      displayName: "UK Bank Transfer",
      instructions:
        "Bank transfer details will be provided when the administrator configures this payment method.",
      accountName: "",
      bankName: "",
      sortCode: "",
      accountNumber: "",
      iban: "",
      swiftBic: "",
      publicKey: "",
      merchantId: "",
    },

    stripe: {
      enabled: false,
      configured: false,
      displayName: "Stripe",
      instructions: "",
      accountName: "",
      bankName: "",
      sortCode: "",
      accountNumber: "",
      iban: "",
      swiftBic: "",
      publicKey: "",
      merchantId: "",
    },

    paypal: {
      enabled: false,
      configured: false,
      displayName: "PayPal",
      instructions: "",
      accountName: "",
      bankName: "",
      sortCode: "",
      accountNumber: "",
      iban: "",
      swiftBic: "",
      publicKey: "",
      merchantId: "",
    },

    payoneer: {
      enabled: false,
      configured: false,
      displayName: "Payoneer",
      instructions: "",
      accountName: "",
      bankName: "",
      sortCode: "",
      accountNumber: "",
      iban: "",
      swiftBic: "",
      publicKey: "",
      merchantId: "",
    },
  },

  design: {
    inheritHomepagePalette: true,

    overrides: {},

    palette: {
      background: "#faf9f6",
      surface: "#f3f0ea",
      heading: "#161614",
      text: "#33332f",
      muted: "#77756e",
      accent: "#68765b",
      buttonBackground: "#161614",
      buttonText: "#ffffff",
    },
  },
};

const settingsRef = doc(db, "siteSettings", "commerce");

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeSettings(saved: unknown): CommerceSettings {
  if (!isObject(saved)) {
    return defaultCommerceSettings;
  }

  const savedPayments = isObject(saved.payments)
    ? saved.payments
    : {};

  const paymentIds: PaymentMethodId[] = [
    "ukBankTransfer",
    "stripe",
    "paypal",
    "payoneer",
  ];

  const payments = { ...defaultCommerceSettings.payments };

  for (const id of paymentIds) {
    const value = savedPayments[id];

    if (isObject(value)) {
      payments[id] = {
        ...defaultCommerceSettings.payments[id],
        ...value,
      } as CommercePaymentMethod;
    }
  }

  const savedDesign = isObject(saved.design) ? saved.design : {};
  const savedPalette = isObject(savedDesign.palette)
    ? savedDesign.palette
    : {};
  const savedOverrides = isObject(savedDesign.overrides)
    ? savedDesign.overrides
    : {};

  return {
    ...defaultCommerceSettings,
    currency: "GBP",
    payments,
    design: {
      inheritHomepagePalette:
        savedDesign.inheritHomepagePalette !== false,
      overrides: savedOverrides as Partial<CommercePalette>,
      palette: {
        ...defaultCommerceSettings.design.palette,
        ...savedPalette,
      } as CommercePalette,
    },
    updatedAt: saved.updatedAt,
  };
}

export async function getCommerceSettings(): Promise<CommerceSettings> {
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return defaultCommerceSettings;
  }

  return mergeSettings(snapshot.data());
}

export async function saveCommerceSettings(
  settings: CommerceSettings,
): Promise<void> {
  const safeSettings: CommerceSettings = {
    ...settings,
    currency: "GBP",
    updatedAt: undefined,
  };

  await setDoc(
    settingsRef,
    {
      ...safeSettings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function getEffectiveCommercePalette(
  settings: CommerceSettings,
  homepagePalette: {
    cream: string;
    paper: string;
    ink: string;
    muted: string;
    olive: string;
  },
): CommercePalette {
  const inherited: CommercePalette = {
    background: homepagePalette.paper,
    surface: homepagePalette.cream,
    heading: homepagePalette.ink,
    text: homepagePalette.ink,
    muted: homepagePalette.muted,
    accent: homepagePalette.olive,
    buttonBackground: homepagePalette.ink,
    buttonText: "#ffffff",
  };

  if (!settings.design.inheritHomepagePalette) {
    return {
      ...settings.design.palette,
      ...settings.design.overrides,
    };
  }

  return {
    ...inherited,
    ...settings.design.overrides,
  };
}

export function getAvailablePaymentMethods(
  settings: CommerceSettings,
): Array<{
  id: PaymentMethodId;
  displayName: string;
  instructions: string;
}> {
  const ids: PaymentMethodId[] = [
    "ukBankTransfer",
    "stripe",
    "paypal",
    "payoneer",
  ];

  return ids
    .filter((id) => {
      const method = settings.payments[id];

      return method.enabled && method.configured;
    })
    .map((id) => {
      const method = settings.payments[id];

      return {
        id,
        displayName: method.displayName,
        instructions: method.instructions,
      };
    });
}
