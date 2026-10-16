import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION = "siteSettings";
const DOCUMENT = "commerce";
const MAX_BODY_BYTES = 64 * 1024;

const PAYMENT_IDS = [
  "ukBankTransfer",
  "stripe",
  "paypal",
  "payoneer",
] as const;

const PAYMENT_FIELDS = [
  "enabled",
  "displayName",
  "instructions",
  "accountName",
  "bankName",
  "sortCode",
  "accountNumber",
  "iban",
  "swiftBic",
  "publicKey",
  "merchantId",
] as const;

const PALETTE_FIELDS = [
  "background",
  "surface",
  "heading",
  "text",
  "muted",
  "accent",
  "buttonBackground",
  "buttonText",
] as const;

const CONTENT_FIELDS = [
  "eyebrow",
  "headline",
  "description",
  "rentalsTitle",
  "tentsTitle",
  "stylingTitle",
  "closingHeadline",
] as const;

const DEFAULT_CONTENT = {
  eyebrow: "REIS EVENT SERVICES",
  headline: "Thoughtfully chosen. Beautifully celebrated.",
  description:
    "Discover considered event rentals, elegant marquees and thoughtful styling for celebrations worth remembering.",
  rentalsTitle: "Event Rentals",
  tentsTitle: "Tents & Marquees",
  stylingTitle: "Event Styling",
  closingHeadline: "Let's make your occasion unforgettable.",
};

const DEFAULT_PALETTE = {
  background: "#faf9f6",
  surface: "#f3f0ea",
  heading: "#161614",
  text: "#33332f",
  muted: "#77756e",
  accent: "#68765b",
  buttonBackground: "#161614",
  buttonText: "#ffffff",
};

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }

  console.error("Commerce API error:", error);

  return NextResponse.json(
    { error: "Unable to process the commerce settings." },
    { status: 500 },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateText(
  value: unknown,
  maximum: number,
): string | null {
  if (typeof value !== "string") return null;

  const text = value.trim();

  if (text.length > maximum) return null;

  return text;
}

function validateColour(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const colour = value.trim();

  if (!/^#[0-9a-fA-F]{6}$/.test(colour)) return null;

  return colour.toLowerCase();
}

function validateContent(value: unknown) {
  if (!isObject(value)) return null;

  const result: Record<string, string> = {};

  const limits: Record<string, number> = {
    eyebrow: 100,
    headline: 200,
    description: 2000,
    rentalsTitle: 120,
    tentsTitle: 120,
    stylingTitle: 120,
    closingHeadline: 200,
  };

  for (const field of CONTENT_FIELDS) {
    const text = validateText(value[field], limits[field]);

    if (text === null) return null;

    result[field] = text;
  }

  return result;
}

function validateDesign(value: unknown) {
  if (!isObject(value)) return null;

  if (typeof value.inheritHomepagePalette !== "boolean") {
    return null;
  }

  if (!isObject(value.palette)) return null;

  const palette: Record<string, string> = {};

  for (const field of PALETTE_FIELDS) {
    const colour = validateColour(value.palette[field]);

    if (!colour) return null;

    palette[field] = colour;
  }

  return {
    inheritHomepagePalette: value.inheritHomepagePalette,
    palette,
  };
}

function validatePayments(value: unknown) {
  if (!isObject(value)) return null;

  const result: Record<string, Record<string, unknown>> = {};

  for (const id of PAYMENT_IDS) {
    const payment = value[id];

    if (!isObject(payment)) return null;

    if (typeof payment.enabled !== "boolean") return null;

    const clean: Record<string, unknown> = {
      enabled: payment.enabled,
    };

    const limits: Record<string, number> = {
      displayName: 100,
      instructions: 2000,
      accountName: 150,
      bankName: 150,
      sortCode: 30,
      accountNumber: 50,
      iban: 50,
      swiftBic: 30,
      publicKey: 500,
      merchantId: 200,
    };

    for (const field of PAYMENT_FIELDS) {
      if (field === "enabled") continue;

      const text = validateText(payment[field], limits[field]);

      if (text === null) return null;

      clean[field] = text;
    }

    // Never trust client-supplied "configured" values.
    // Real payment integration status must be verified separately.
    result[id] = clean;
  }

  return result;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .doc(DOCUMENT)
      .get();

    const saved = snapshot.exists ? snapshot.data() ?? {} : {};

    const payments: Record<string, unknown> = {};

    for (const id of PAYMENT_IDS) {
      const payment = isObject(saved.payments)
        ? saved.payments[id]
        : undefined;

      const paymentData = isObject(payment) ? payment : {};

      payments[id] = {
        enabled: paymentData.enabled === true,
        configured: paymentData.configured === true,
        displayName:
          typeof paymentData.displayName === "string"
            ? paymentData.displayName
            : id,
        instructions:
          typeof paymentData.instructions === "string"
            ? paymentData.instructions
            : "",
        accountName:
          typeof paymentData.accountName === "string"
            ? paymentData.accountName
            : "",
        bankName:
          typeof paymentData.bankName === "string"
            ? paymentData.bankName
            : "",
        sortCode:
          typeof paymentData.sortCode === "string"
            ? paymentData.sortCode
            : "",
        accountNumber:
          typeof paymentData.accountNumber === "string"
            ? paymentData.accountNumber
            : "",
        iban:
          typeof paymentData.iban === "string"
            ? paymentData.iban
            : "",
        swiftBic:
          typeof paymentData.swiftBic === "string"
            ? paymentData.swiftBic
            : "",
        publicKey:
          typeof paymentData.publicKey === "string"
            ? paymentData.publicKey
            : "",
        merchantId:
          typeof paymentData.merchantId === "string"
            ? paymentData.merchantId
            : "",
      };
    }

    const savedDesign = isObject(saved.design) ? saved.design : {};
    const savedPalette = isObject(savedDesign.palette)
      ? savedDesign.palette
      : {};

    const palette: Record<string, string> = {};

    for (const field of PALETTE_FIELDS) {
      palette[field] =
        typeof savedPalette[field] === "string"
          ? savedPalette[field] as string
          : DEFAULT_PALETTE[field as keyof typeof DEFAULT_PALETTE];
    }

    const savedContent = isObject(saved.content) ? saved.content : {};

    const content: Record<string, string> = {};

    for (const field of CONTENT_FIELDS) {
      content[field] =
        typeof savedContent[field] === "string"
          ? savedContent[field] as string
          : DEFAULT_CONTENT[field as keyof typeof DEFAULT_CONTENT];
    }

    return NextResponse.json({
      settings: {
        currency: "GBP",
        content,
        design: {
          inheritHomepagePalette:
            savedDesign.inheritHomepagePalette !== false,
          palette,
        },
        payments,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const contentLength = Number(
      request.headers.get("content-length") ?? "0",
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_BODY_BYTES
    ) {
      return NextResponse.json(
        { error: "The settings payload is too large." },
        { status: 413 },
      );
    }

    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "The settings payload is too large." },
        { status: 413 },
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 },
      );
    }

    if (!isObject(body) || !isObject(body.settings)) {
      return NextResponse.json(
        { error: "Invalid commerce settings." },
        { status: 400 },
      );
    }

    const settings = body.settings;

    const content = validateContent(settings.content);
    const design = validateDesign(settings.design);
    const payments = validatePayments(settings.payments);

    if (!content || !design || !payments) {
      return NextResponse.json(
        {
          error:
            "Some settings are invalid. Check the text fields, colours and payment details.",
        },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const reference = db.collection(COLLECTION).doc(DOCUMENT);

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const existing = snapshot.exists ? snapshot.data() ?? {} : {};

      const existingPayments = isObject(existing.payments)
        ? existing.payments
        : {};

      const safePayments: Record<string, unknown> = {};

      for (const id of PAYMENT_IDS) {
        const incoming = payments[id];
        const previous = isObject(existingPayments[id])
          ? existingPayments[id]
          : {};

        // Preserve configuration status only if the existing record
        // already has it. The client cannot mark a provider configured.
        safePayments[id] = {
          ...incoming,
          configured: previous.configured === true,
        };
      }

      transaction.set(
        reference,
        {
          currency: "GBP",
          content,
          design: {
            inheritHomepagePalette: design.inheritHomepagePalette,
            palette: design.palette,
            // Preserve existing palette overrides used by the CMS module.
            overrides: isObject(existing.design)
              && isObject(existing.design.overrides)
              ? existing.design.overrides
              : {},
          },
          payments: safePayments,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return NextResponse.json({
      success: true,
      message: "Commerce settings saved.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
