"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/** Gentle wheel inertia; touch and reduced-motion users keep native scrolling. */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    let dispose: (() => void) | undefined;

    const configure = () => {
      dispose?.();
      dispose = undefined;
      if (!preference.matches) return;

      const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        wheelMultiplier: 0.55,
        lerp: 0.075,
        anchors: true,
        allowNestedScroll: true,
        syncTouch: false,
      });

      // Menus and video dialogs already lock the body while they are open.
      const syncLock = () => {
        if (getComputedStyle(document.body).overflow === "hidden") lenis.stop();
        else lenis.start();
      };
      const observer = new MutationObserver(syncLock);
      observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
      syncLock();
      dispose = () => {
        observer.disconnect();
        lenis.destroy();
      };
    };

    configure();
    preference.addEventListener("change", configure);
    return () => {
      preference.removeEventListener("change", configure);
      dispose?.();
    };
  }, [pathname]);

  return null;
}
