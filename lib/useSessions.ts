"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "./types";
import {
  getServerSessionsSnapshot,
  getSessionsSnapshot,
  saveSessions,
  subscribeToSessions,
} from "./storage";

export function useSessions(): [Session[], (next: Session[]) => void] {
  const sessions = useSyncExternalStore(
    subscribeToSessions,
    getSessionsSnapshot,
    getServerSessionsSnapshot,
  );
  return [sessions, saveSessions];
}

const noopSubscribe = () => () => {};

/** False during SSR and the initial hydration render, true after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
