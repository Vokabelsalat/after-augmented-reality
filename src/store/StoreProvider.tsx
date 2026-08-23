"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store";
import { hydrateJourney } from "@/store/journeySlice";
import {
  loadJourney,
  subscribeToJourneyPersistence,
} from "@/store/persistence";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persisted = loadJourney(window.localStorage);
    if (persisted) store.dispatch(hydrateJourney(persisted));
    const unsubscribe = subscribeToJourneyPersistence(
      store,
      window.localStorage,
    );
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [store]);

  return (
    <Provider store={store}>
      {ready ? (
        children
      ) : (
        <div className="flex min-h-dvh items-center justify-center bg-[#050505] text-[11px] uppercase tracking-[0.28em] text-white/45">
          Gathering fragments
        </div>
      )}
    </Provider>
  );
}
