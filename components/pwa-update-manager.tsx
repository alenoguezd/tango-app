"use client";

import { useEffect, useRef, useState } from "react";

export function PwaUpdateManager() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const hasReloadedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let isUnmounted = false;

    const showUpdatePrompt = (worker: ServiceWorker | null) => {
      if (!worker || isUnmounted) {
        return;
      }

      waitingWorkerRef.current = worker;
      setIsVisible(true);
    };

    const handleControllerChange = () => {
      if (hasReloadedRef.current) {
        return;
      }

      hasReloadedRef.current = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdatePrompt(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdatePrompt(installingWorker);
            }
          });
        });

        await registration.update();
      } catch (error) {
        console.error("PWA update check failed", error);
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    void registerServiceWorker();

    return () => {
      isUnmounted = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  const handleRefresh = () => {
    const waitingWorker = waitingWorkerRef.current;

    if (!waitingWorker) {
      return;
    }

    setIsRefreshing(true);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    window.setTimeout(() => {
      if (!hasReloadedRef.current) {
        hasReloadedRef.current = true;
        window.location.reload();
      }
    }, 4000);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 text-[var(--color-ink)] shadow-xl backdrop-blur"
      role="status"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold">Nueva versión disponible</p>
        <p className="text-xs text-[var(--color-muted)]">
          Actualiza para usar los cambios más recientes.
        </p>
      </div>
      <button
        className="shrink-0 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70"
        disabled={isRefreshing}
        onClick={handleRefresh}
        type="button"
      >
        {isRefreshing ? "Actualizando..." : "Actualizar"}
      </button>
    </div>
  );
}
