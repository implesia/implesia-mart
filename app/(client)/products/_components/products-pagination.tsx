"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type PageButtonProps = {
  children: React.ReactNode;
  active?: boolean;
};

function PageButton({ children, active }: PageButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      className={cn(
        "h-10 w-10 rounded-lg font-semibold",
        active
          ? "shadow-lg"
          : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
      )}
    >
      {children}
    </Button>
  );
}

export function ProductsPagination() {
  return (
    <div className="mt-20 flex items-center justify-center gap-2">
      <PageButton active>1</PageButton>
      <PageButton>2</PageButton>
      <PageButton>3</PageButton>
      <PageButton>4</PageButton>
      <span className="px-2 text-muted-foreground">…</span>
      <Button
        type="button"
        variant="ghost"
        className="h-10 gap-2 rounded-lg font-semibold text-primary hover:bg-surface-container-low"
      >
        Next <MaterialIcon name="arrow_forward" className="text-[18px]" />
      </Button>
    </div>
  );
}

