"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type CategoryRailContextValue = {
  open: boolean;
  toggle: () => void;
};

const CategoryRailContext = createContext<CategoryRailContextValue | null>(null);

export function CategoryRailProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const toggle = useCallback(() => setOpen((current) => !current), []);
  const value = useMemo(() => ({ open, toggle }), [open, toggle]);

  return <CategoryRailContext.Provider value={value}>{children}</CategoryRailContext.Provider>;
}

export function useCategoryRail() {
  const context = useContext(CategoryRailContext);
  if (!context) {
    throw new Error("useCategoryRail must be used within CategoryRailProvider");
  }
  return context;
}
