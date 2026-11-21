"use client";

import { useSyncExternalStore } from "react";

import { isSuperadmin } from "@/lib/admin/staff-role";
import { readSession } from "@/lib/mart-mock/store";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return isSuperadmin(readSession()?.role);
}

function getServerSnapshot() {
  return false;
}

/** True only when the signed-in admin staff member has the `superadmin` role. */
export function useIsSuperadmin(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
