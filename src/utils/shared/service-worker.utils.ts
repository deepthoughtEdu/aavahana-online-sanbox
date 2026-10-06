// src/utils/service-worker.utils.ts
import { logger } from "@/lib/managers/logger";

/**
 * ============================================
 * SERVICE WORKER UTILITIES
 * ============================================
 * Utilities for managing service worker registration
 */

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Register service worker for push notifications
 *
 * @returns Promise that resolves to ServiceWorkerRegistration or null
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    logger.warn("[ServiceWorker] Service workers are not supported");
    return null;
  }

  try {
    logger.info("[ServiceWorker] Registering service worker");

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    logger.info("[ServiceWorker] Service worker registered successfully", {
      scope: registration.scope,
    });

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            logger.info("[ServiceWorker] New service worker available");
            // Optionally notify user about update
          }
        });
      }
    });

    return registration;
  } catch (error) {
    logger.error("[ServiceWorker] Failed to register service worker", error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const results = await Promise.all(
      registrations.map((registration) => registration.unregister())
    );

    logger.info("[ServiceWorker] Unregistered all service workers");
    return results.every((result) => result === true);
  } catch (error) {
    logger.error("[ServiceWorker] Failed to unregister service workers", error);
    return false;
  }
}

/**
 * Get active service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    logger.error("[ServiceWorker] Failed to get service worker registration", error);
    return null;
  }
}
