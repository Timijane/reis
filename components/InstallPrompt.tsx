"use client";

import { useEffect, useState } from "react";
import { getHomepageContent } from "@/lib/cms/homepage";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISSED_KEY = "reis-install-prompt-dismissed";

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandName, setBrandName] = useState("REIS Event Services");
  const [installed, setInstalled] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    let active = true;

    getHomepageContent()
      .then((content) => {
        if (!active) return;
        setLogoUrl(
          typeof content.logoUrl === "string" ? content.logoUrl.trim() : ""
        );
        setBrandName(
          typeof content.brandName === "string" && content.brandName.trim()
            ? content.brandName.trim()
            : "REIS Event Services"
        );
      })
      .catch((error) => {
        console.error("Failed to load REIS CMS logo for install prompt:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const standalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (navigator as Navigator & { standalone?: boolean }).standalone
      );

    const isIos =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;

    setIos(isIos);

    if (standalone()) return;

    let dismissed = false;

    try {
      dismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // Continue if browser storage is unavailable.
    }

    if (dismissed) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstalling(false);
      setInstallEvent(null);
      setInstructions(false);
      setStatusMessage(
        "REIS has been installed successfully. You can open it from your home screen."
      );

      try {
        window.localStorage.setItem(DISMISSED_KEY, "1");
      } catch {
        // Installation confirmation still works without storage.
      }

      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => setVisible(true), 4500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);

    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Dismiss for this session even if browser storage is unavailable.
    }
  }

  async function install() {
    setStatusMessage("");

    if (!installEvent) {
      setInstructions(true);
      return;
    }

    try {
      setInstalling(true);
      await installEvent.prompt();

      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      setInstalling(false);

      if (choice.outcome === "accepted") {
        setInstructions(false);
        setStatusMessage(
          "Your browser accepted the installation request. Check your home screen in a moment."
        );
      } else {
        setStatusMessage(
          "Installation was cancelled. You can try again from your browser menu."
        );
      }
    } catch (error) {
      console.error("REIS installation prompt failed:", error);
      setInstalling(false);
      setStatusMessage(
        "Installation could not start. Open your browser menu and look for an installation option."
      );
    }
  }

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="reis-install-title"
      className="reis-install"
    >
      <button
        type="button"
        className="reis-install__close"
        onClick={dismiss}
        aria-label="Close installation prompt"
      >
        ×
      </button>

      <div className="reis-install__mark">
        {logoUrl ? (
          <img
            className="reis-install__logo"
            src={logoUrl}
            alt={`${brandName} logo`}
          />
        ) : (
          <span aria-hidden="true">RIS</span>
        )}
      </div>

      <div className="reis-install__copy">
        <p className="reis-install__eyebrow">TAKE REIS WITH YOU</p>

        <h2 id="reis-install-title">
          {installed
            ? "REIS is ready."
            : "A better way to plan your event."}
        </h2>

        <p>
          {installed
            ? "Installation is complete. Open REIS Event Services from your home screen whenever you need our services."
            : "Add REIS Event Services to your home screen for convenient access to our rentals, styling and booking services."}
        </p>

        {instructions && !installed && (
          <p className="reis-install__instructions" role="status">
            {ios
              ? 'In Safari, tap Share, then choose "Add to Home Screen".'
              : 'Open your browser menu and look for "Install app", "Install REIS" or "Add to Home screen". The option depends on your browser.'}
          </p>
        )}

        {statusMessage && (
          <p className="reis-install__status" role="status">
            {statusMessage}
          </p>
        )}

        <div className="reis-install__actions">
          {!installed && (
            <button
              type="button"
              className="reis-install__primary"
              onClick={install}
              disabled={installing}
            >
              {installing
                ? "Opening installer..."
                : instructions
                  ? "Try installation again"
                  : "Install REIS"}
            </button>
          )}

          <button
            type="button"
            className="reis-install__secondary"
            onClick={dismiss}
          >
            {installed ? "Close" : "Maybe later"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .reis-install {
          position: fixed;
          z-index: 1000;
          right: 20px;
          bottom: 20px;
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr);
          gap: 16px;
          width: min(440px, calc(100vw - 32px));
          padding: 24px;
          border: 1px solid #ded8ca;
          background: #f7f4ed;
          color: #282a25;
          box-shadow: 0 18px 55px rgba(25, 32, 24, 0.2);
          font-family: Arial, Helvetica, sans-serif;
        }

        .reis-install__close {
          position: absolute;
          top: 8px;
          right: 12px;
          border: 0;
          background: transparent;
          color: #454a40;
          font-size: 26px;
          cursor: pointer;
        }

        .reis-install__mark {
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          overflow: hidden;
          background: #354737;
          color: #f7f4ed;
          font-family: Georgia, serif;
          font-size: 19px;
          letter-spacing: 1px;
        }

        .reis-install__logo {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .reis-install__eyebrow {
          margin: 0 20px 8px 0;
          color: #596b51;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .reis-install h2 {
          margin: 0 18px 10px 0;
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 400;
          line-height: 1.2;
        }

        .reis-install__copy > p:not(.reis-install__eyebrow) {
          margin: 0 0 16px;
          color: #62635b;
          font-size: 13px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .reis-install__copy .reis-install__instructions,
        .reis-install__copy .reis-install__status {
          padding: 10px;
          border-left: 2px solid #596b51;
          background: #eeeadf;
          color: #354737;
        }

        .reis-install__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .reis-install__primary,
        .reis-install__secondary {
          min-height: 42px;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .reis-install__primary {
          border: 1px solid #354737;
          background: #354737;
          color: #fff;
        }

        .reis-install__primary:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .reis-install__secondary {
          border: 1px solid #d7d1c5;
          background: transparent;
          color: #354737;
        }

        @media (max-width: 480px) {
          .reis-install {
            right: 12px;
            bottom: 12px;
            grid-template-columns: 42px minmax(0, 1fr);
            gap: 12px;
            padding: 20px 16px;
          }

          .reis-install__mark {
            width: 42px;
            height: 42px;
            font-size: 15px;
          }

          .reis-install h2 {
            font-size: 20px;
          }
        }
      `}</style>
    </aside>
  );
}
