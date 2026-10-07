import { cn } from "@/lib/utils";

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function MaterialIcon({
  name,
  className,
  filled = false,
}: MaterialIconProps) {
  return (
    <span
      suppressHydrationWarning
      className={cn(
        "material-symbols-outlined shrink-0 select-none leading-none",
        filled && "material-symbols-outlined--fill",
        className,
      )}
      data-icon={name}
      aria-hidden="true"
    />
  );
}
