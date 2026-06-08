import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { buildSentryRelease } from "@/lib/sentryContext";
import {
  installChunkErrorRecovery,
  isChunkLoadError,
  reloadForChunkError,
} from "@/lib/chunkErrorRecovery";

// Install BEFORE Sentry so chunk-load errors auto-reload before reaching
// the Sentry error boundary (avoids the "Something went wrong" dead-end
// when a user's tab predates a deploy).
installChunkErrorRecovery();

declare const __APP_VERSION__: string;
declare const __BUILD_SHA__: string;

// Initialize Sentry as early as possible in the application lifecycle
// DSN must be provided via VITE_SENTRY_DSN environment variable
// Never hardcode DSNs in source code
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

let SENTRY_INITIALIZED = false;

// Store feedback integration instance for manual access
const feedbackIntegration = Sentry.feedbackIntegration({
  // Set autoInject to false so we can control when to show the dialog
  autoInject: false,
});

// Store globally for access in components
if (typeof window !== "undefined") {
  (window as any).__sentryFeedbackIntegration = feedbackIntegration;
}

if (SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      release: buildSentryRelease(__APP_VERSION__, __BUILD_SHA__),
      // 2026-06-08 (SENTRY_OBSERVABILITY_STRATEGY §4.J): explicit PII OFF.
      // PVL is a research tool. We don't need IP addresses, user-agent
      // fingerprints, or cookie data to triage bugs — the breadcrumb +
      // stack trace + release tag are enough. Explicit `false` here also
      // signals intent to anyone touching this file later.
      sendDefaultPii: false,
      // 2026-06-08: dropped traces + profiles from 1.0 → 0.1 (10%). At 1.0
      // every page nav sent a full performance trace, which would scale
      // poorly post-publish. 10% gives sufficient signal for latency
      // hunting; bump back up if a specific debugging window needs it.
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      // 2026-06-08 (SENTRY_OBSERVABILITY_STRATEGY §4.I): session replay
      // tuning. Was 0% session + 100% error. Bumped session to 1% so we
      // get ~10 replays/day at the projected adoption — useful for UX
      // research (where users hesitate, mis-click, drop off) without
      // burning the replay quota at higher rates.
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE || "development",
      // Enable debug mode to see Sentry activity in console (disable in production)
      debug: import.meta.env.VITE_SENTRY_DEBUG === "true",
      // 2026-06-08: replay integration now masks text + blocks media by
      // default for the rare cases researchers paste sequences or
      // sensitive metadata into the page. PII protection on the replay
      // pipeline matches the new sendDefaultPii: false posture above.
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        feedbackIntegration,
      ],
    });

    SENTRY_INITIALIZED = true;
    console.log("[SENTRY] Initialized successfully");
  } catch (error) {
    console.error("[SENTRY] Failed to initialize:", error);
    SENTRY_INITIALIZED = false;
  }
} else {
  console.warn("[SENTRY] No DSN provided (VITE_SENTRY_DSN env var not set), Sentry disabled");
}

// Expose test function to window for manual testing
(window as any).testSentry = () => {
  if (!SENTRY_INITIALIZED) {
    console.error("[SENTRY] Not initialized");
    return;
  }

  console.log("[SENTRY] Sending test events...");

  // Test 1: Message
  const msgId = Sentry.captureMessage("Test message from frontend", "info");
  console.log("[SENTRY] Test message sent:", msgId);

  // Test 2: Exception
  const excId = Sentry.captureException(new Error("Test exception from frontend"));
  console.log("[SENTRY] Test exception sent:", excId);

  // Test 3: Manual throw (will be caught by ErrorBoundary)
  setTimeout(() => {
    throw new Error("Test async error from frontend");
  }, 100);

  alert("Test events sent! Check Sentry dashboard and browser console.");
};

// Capture unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  Sentry.captureException(event.reason);
});

// Capture uncaught errors
window.addEventListener("error", (event) => {
  Sentry.captureException(event.error);
});

const container = document.getElementById("root")!;
const root = createRoot(container);

// Wrap app in ErrorBoundary to catch React render errors.
//
// Special case: if the error is a chunk-load failure (stale tab during a
// deploy), bypass the dialog entirely and reload — the global handlers in
// chunkErrorRecovery should already have caught it, but this is the last
// line of defence inside the React render tree.
root.render(
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => {
      if (isChunkLoadError(error)) {
        reloadForChunkError();
        return (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Updating the app…</p>
          </div>
        );
      }
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>{error instanceof Error ? error.message : String(error)}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      );
    }}
    showDialog
  >
    <App />
  </Sentry.ErrorBoundary>
);
