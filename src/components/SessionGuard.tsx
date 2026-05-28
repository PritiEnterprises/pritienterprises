"use client";

import { useEffect } from "react";

export function SessionGuard() {

  useEffect(() => {

    const clearSession = async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error(err);
      }
    };

    const handleBeforeUnload = () => {
      navigator.sendBeacon("/api/auth/logout");
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };

  }, []);

  return null;
}