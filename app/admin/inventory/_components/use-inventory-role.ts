"use client";

import { useSyncExternalStore } from "react";

import { canWriteInventory } from "@/lib/admin/staff-role";
import { readSession } from "@/lib/mart-mock/store";

const SESSION_EVENT = "implesia-admin-session";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useInventoryWriter() {
  const role = useSyncExternalStore(
    subscribe,
    () => readSession()?.role ?? null,
    () => null,
  );
  return canWriteInventory(role);
}
