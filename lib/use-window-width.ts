"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_WIDTH = 1024;

function subscribeToResize(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

function getWindowWidth() {
  return window.innerWidth;
}

function getServerWindowWidth() {
  return DESKTOP_WIDTH;
}

export function useWindowWidth() {
  return useSyncExternalStore(
    subscribeToResize,
    getWindowWidth,
    getServerWindowWidth
  );
}
