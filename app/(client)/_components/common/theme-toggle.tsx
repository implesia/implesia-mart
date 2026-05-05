"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "../../_providers/theme-provider";
import { MaterialIcon } from "./material-icon";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className={className}
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      <MaterialIcon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} />
    </Button>
  );
}

