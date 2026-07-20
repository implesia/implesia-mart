import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { BlogContentBlock } from "../../_data/blogs/blogs";

export function BlogContent({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="max-w-none">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const id = `section-${idx}`;
          return (
            <h2
              key={idx}
              id={id}
              className="mt-10 mb-3 scroll-mt-28 text-xl font-semibold tracking-tight text-on-surface sm:mt-12 sm:text-2xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={idx} className="my-5 space-y-2.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-[15px] leading-relaxed text-on-surface sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "callout") {
          const isTip = block.variant !== "note";
          return (
            <aside
              key={idx}
              className={cn(
                "my-6 flex gap-3 rounded-xl border-l-4 p-4 sm:rounded-2xl sm:p-5",
                isTip
                  ? "border-l-primary bg-primary/8 dark:bg-primary/12"
                  : "border-l-warm-gold bg-surface-container-low dark:bg-surface-container",
              )}
            >
              <MaterialIcon
                name={isTip ? "lightbulb" : "info"}
                filled
                className={cn(
                  "mt-0.5 shrink-0 text-[22px]",
                  isTip ? "text-primary" : "text-warm-gold",
                )}
              />
              <div className="min-w-0">
                <p className="mb-1 text-sm font-semibold text-on-surface">{block.title}</p>
                <p className="text-sm leading-relaxed text-on-surface-variant sm:text-[15px]">
                  {block.text}
                </p>
              </div>
            </aside>
          );
        }

        return (
          <p
            key={idx}
            className="mb-4 text-[15px] leading-[1.8] text-on-surface-variant sm:mb-5 sm:text-base sm:leading-[1.85]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
