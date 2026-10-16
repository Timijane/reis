"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import "./commerce.css";

type PaymentId = "ukBankTransfer" | "stripe" | "paypal" | "payoneer";

type PaymentSettings = {
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
};

type CommerceSettings = {
  currency: "GBP";
  content: {
    eyebrow: string;
    headline: string;
    description: string;
    rentalsTitle: string;
    tentsTitle: string;
    stylingTitle: string;
    closingHeadline: string;
  };
  design: {
    inheritHomepagePalette: boolean;
    palette: {
      background: string;
      surface: string;
      heading: string;
      text: string;
      muted: string;
      accent: string;
      buttonBackground: string;
      buttonText: string;
    };
  };
  payments: Record<PaymentId, PaymentSettings>;
};

const defaults: CommerceSettings = {
  currency: "GBP",
  content: {
    eyebrow: "REIS EVENT SERVICES",
    headline: "Thoughtfully chosen. Beautifully celebrated.",
    description:
      "Discover the details, rentals and services that bring your celebration to life.",
    rentalsTitle: "Event Rentals",
    tentsTitle: "Tents & Marquees",
    stylingTitle: "Event Styling",
    closingHeadline:
      "Your occasion. Your vision. Our attention to detail.",
  },
  design: {
    inheritHomepagePalette: true,
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
  payments: {
    ukBankTransfer: {
      enabled: false,
      configured: false,
      displayName: "UK Bank Transfer",
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
};

const paymentLabels: Record<PaymentId, string> = {
  ukBankTransfer: "UK bank transfer",
  stripe: "Stripe",
  paypal: "PayPal",
  payoneer: "Payoneer",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function mergeSettings(value: unknown): CommerceSettings {
  if (!isObject(value)) return defaults;

  const savedContent = isObject(value.content) ? value.content : {};
  const savedDesign = isObject(value.design) ? value.design : {};
  const savedPalette = isObject(savedDesign.palette)
    ? savedDesign.palette
    : {};
  const savedPayments = isObject(value.payments)
    ? value.payments
    : {};

  const content = { ...defaults.content };

  for (const key of Object.keys(content) as (keyof typeof content)[]) {
    const saved = savedContent[key];

    if (typeof saved === "string") {
      content[key] = saved;
    }
  }

  const palette = { ...defaults.design.palette };

  for (const key of Object.keys(palette) as (keyof typeof palette)[]) {
    const saved = savedPalette[key];

    if (typeof saved === "string" && /^#[0-9a-fA-F]{6}$/.test(saved)) {
      palette[key] = saved;
    }
  }

  const payments = { ...defaults.payments };

  for (const id of Object.keys(paymentLabels) as PaymentId[]) {
    const saved = savedPayments[id];

    if (!isObject(saved)) continue;

    const payment = { ...defaults.payments[id] };

    if (typeof saved.enabled === "boolean") {
      payment.enabled = saved.enabled;
    }

    if (typeof saved.configured === "boolean") {
      payment.configured = saved.configured;
    }

    for (const key of [
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
    ] as const) {
      if (typeof saved[key] === "string") {
        payment[key] = saved[key];
      }
    }

    payments[id] = payment;
  }

  return {
    currency: "GBP",
    content,
    design: {
      inheritHomepagePalette:
        savedDesign.inheritHomepagePalette !== false,
      palette,
    },
    payments,
  };
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Your administrator session has expired. Please sign in again.",
    );
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

export default function CommerceAdminPage() {
  const [settings, setSettings] = useState<CommerceSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activePayment, setActivePayment] =
    useState<PaymentId>("ukBankTransfer");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const headers = await getAuthHeaders();

        const response = await fetch("/api/admin/commerce", {
          method: "GET",
          headers,
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to load commerce settings.",
          );
        }

        if (!cancelled) {
          setSettings(mergeSettings(result.settings));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load commerce settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateContent(
    key: keyof CommerceSettings["content"],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      content: {
        ...current.content,
        [key]: value,
      },
    }));
  }

  function updatePalette(
    key: keyof CommerceSettings["design"]["palette"],
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      design: {
        ...current.design,
        palette: {
          ...current.design.palette,
          [key]: value,
        },
      },
    }));
  }

  function updatePayment(
    id: PaymentId,
    key: keyof PaymentSettings,
    value: string | boolean,
  ) {
    setSettings((current) => ({
      ...current,
      payments: {
        ...current.payments,
        [id]: {
          ...current.payments[id],
          [key]: value,
        },
      },
    }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/admin/commerce", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Could not save commerce settings.",
        );
      }

      setMessage("Commerce settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save commerce settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="commerce-admin">
        <p className="commerce-status">Loading commerce settings…</p>
      </main>
    );
  }

  return (
    <main className="commerce-admin">
      <header className="commerce-admin__header">
        <div>
          <p className="commerce-admin__eyebrow">REIS EVENT SERVICES</p>
          <h1>Commerce settings</h1>
          <p>
            Manage the shopping experience, appearance and payment
            preferences for your event services.
          </p>
        </div>

        <button
          type="button"
          className="commerce-button commerce-button--primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </header>

      {message && (
        <p className="commerce-notice commerce-notice--success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="commerce-notice commerce-notice--error" role="alert">
          {error}
        </p>
      )}

      <section className="commerce-panel">
        <div className="commerce-panel__heading">
          <p className="commerce-admin__eyebrow">01 / CONTENT</p>
          <h2>Commerce landing page</h2>
          <p>
            Edit the copy shown on the commerce landing page.
          </p>
        </div>

        <div className="commerce-fields">
          <label>
            Eyebrow
            <input
              value={settings.content.eyebrow}
              onChange={(event) =>
                updateContent("eyebrow", event.target.value)
              }
              maxLength={100}
            />
          </label>

          <label>
            Main headline
            <input
              value={settings.content.headline}
              onChange={(event) =>
                updateContent("headline", event.target.value)
              }
              maxLength={200}
            />
          </label>

          <label className="commerce-field--full">
            Description
            <textarea
              value={settings.content.description}
              onChange={(event) =>
                updateContent("description", event.target.value)
              }
              rows={4}
              maxLength={2000}
            />
          </label>

          <label>
            Rentals title
            <input
              value={settings.content.rentalsTitle}
              onChange={(event) =>
                updateContent("rentalsTitle", event.target.value)
              }
              maxLength={120}
            />
          </label>

          <label>
            Tents and marquees title
            <input
              value={settings.content.tentsTitle}
              onChange={(event) =>
                updateContent("tentsTitle", event.target.value)
              }
              maxLength={120}
            />
          </label>

          <label>
            Styling title
            <input
              value={settings.content.stylingTitle}
              onChange={(event) =>
                updateContent("stylingTitle", event.target.value)
              }
              maxLength={120}
            />
          </label>

          <label>
            Closing headline
            <input
              value={settings.content.closingHeadline}
              onChange={(event) =>
                updateContent("closingHeadline", event.target.value)
              }
              maxLength={200}
            />
          </label>
        </div>
      </section>

      <section className="commerce-panel">
        <div className="commerce-panel__heading">
          <p className="commerce-admin__eyebrow">02 / DESIGN</p>
          <h2>Commerce colours</h2>
          <p>
            Inherit the homepage palette or customise commerce separately.
          </p>
        </div>

        <label className="commerce-toggle">
          <input
            type="checkbox"
            checked={settings.design.inheritHomepagePalette}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                design: {
                  ...current.design,
                  inheritHomepagePalette: event.target.checked,
                },
              }))
            }
          />
          <span>
            Inherit homepage colours
            <small>
              When enabled, the public commerce page must use the homepage
              palette.
            </small>
          </span>
        </label>

        {!settings.design.inheritHomepagePalette && (
          <div className="commerce-colours">
            {(
              Object.keys(settings.design.palette) as Array<
                keyof CommerceSettings["design"]["palette"]
              >
            ).map((key) => (
              <label className="commerce-colour" key={key}>
                <span>{key.replace(/([A-Z])/g, " $1")}</span>
                <div>
                  <input
                    type="color"
                    value={settings.design.palette[key]}
                    onChange={(event) =>
                      updatePalette(key, event.target.value)
                    }
                    aria-label={`${key} colour`}
                  />
                  <input
                    value={settings.design.palette[key]}
                    onChange={(event) =>
                      updatePalette(key, event.target.value)
                    }
                    pattern="^#[0-9a-fA-F]{6}$"
                    maxLength={7}
                    aria-label={`${key} hex value`}
                  />
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="commerce-panel">
        <div className="commerce-panel__heading">
          <p className="commerce-admin__eyebrow">03 / PAYMENTS</p>
          <h2>Payment preferences</h2>
          <p>
            Configure the details displayed to customers. Enabling a method
            here does not activate a payment gateway or prove that it is ready
            to process payments.
          </p>
        </div>

        <div className="commerce-payment-tabs">
          {(Object.keys(paymentLabels) as PaymentId[]).map((id) => (
            <button
              type="button"
              key={id}
              className={
                activePayment === id
                  ? "commerce-payment-tab is-active"
                  : "commerce-payment-tab"
              }
              onClick={() => setActivePayment(id)}
            >
              {paymentLabels[id]}
            </button>
          ))}
        </div>

        {(() => {
          const payment = settings.payments[activePayment];

          return (
            <div className="commerce-payment-editor">
              <h3>{paymentLabels[activePayment]}</h3>

              <label className="commerce-toggle">
                <input
                  type="checkbox"
                  checked={payment.enabled}
                  onChange={(event) =>
                    updatePayment(
                      activePayment,
                      "enabled",
                      event.target.checked,
                    )
                  }
                />
                <span>
                  Enable this payment preference
                  <small>
                    This saves your preference only. Gateway readiness must
                    be verified separately.
                  </small>
                </span>
              </label>

              <div className="commerce-fields">
                <label>
                  Display name
                  <input
                    value={payment.displayName}
                    onChange={(event) =>
                      updatePayment(
                        activePayment,
                        "displayName",
                        event.target.value,
                      )
                    }
                    maxLength={100}
                  />
                </label>

                <label className="commerce-field--full">
                  Customer instructions
                  <textarea
                    value={payment.instructions}
                    onChange={(event) =>
                      updatePayment(
                        activePayment,
                        "instructions",
                        event.target.value,
                      )
                    }
                    rows={3}
                    maxLength={2000}
                  />
                </label>

                {activePayment === "ukBankTransfer" && (
                  <>
                    <label>
                      Account name
                      <input
                        value={payment.accountName}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "accountName",
                            event.target.value,
                          )
                        }
                        maxLength={150}
                      />
                    </label>

                    <label>
                      Bank name
                      <input
                        value={payment.bankName}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "bankName",
                            event.target.value,
                          )
                        }
                        maxLength={150}
                      />
                    </label>

                    <label>
                      Sort code
                      <input
                        value={payment.sortCode}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "sortCode",
                            event.target.value,
                          )
                        }
                        maxLength={30}
                      />
                    </label>

                    <label>
                      Account number
                      <input
                        value={payment.accountNumber}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "accountNumber",
                            event.target.value,
                          )
                        }
                        maxLength={50}
                      />
                    </label>

                    <label>
                      IBAN
                      <input
                        value={payment.iban}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "iban",
                            event.target.value,
                          )
                        }
                        maxLength={50}
                      />
                    </label>

                    <label>
                      SWIFT / BIC
                      <input
                        value={payment.swiftBic}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "swiftBic",
                            event.target.value,
                          )
                        }
                        maxLength={30}
                      />
                    </label>
                  </>
                )}

                {(activePayment === "stripe" ||
                  activePayment === "paypal" ||
                  activePayment === "payoneer") && (
                  <>
                    <label>
                      Public key, if applicable
                      <input
                        value={payment.publicKey}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "publicKey",
                            event.target.value,
                          )
                        }
                        maxLength={500}
                        autoComplete="off"
                      />
                    </label>

                    <label>
                      Merchant ID, if applicable
                      <input
                        value={payment.merchantId}
                        onChange={(event) =>
                          updatePayment(
                            activePayment,
                            "merchantId",
                            event.target.value,
                          )
                        }
                        maxLength={200}
                        autoComplete="off"
                      />
                    </label>
                  </>
                )}
              </div>

              <p className="commerce-payment-warning">
                Never enter secret API keys, passwords, private keys or
                payment-provider credentials here. Those belong in secure
                server-side environment variables.
              </p>
            </div>
          );
        })()}
      </section>

      <footer className="commerce-admin__footer">
        <p>
          Currency: GBP (£). Payment gateway integrations and public checkout
          availability require separate verification.
        </p>

        <button
          type="button"
          className="commerce-button commerce-button--primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save all changes"}
        </button>
      </footer>
    </main>
  );
}
