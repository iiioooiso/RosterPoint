"use client";

import { useEffect } from "react";

export function ServiceWorkerUnregister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.hostname === "localhost"
    ) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return null;
}
