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
              className="mt-8 mb-3 scroll-mt-28 text-xl font-semibold tracking-tight text-neutral-950 sm:mt-10 sm:text-2xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={idx} className="my-4 space-y-2.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-[15px] leading-relaxed text-neutral-700 sm:text-base">
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
                "my-5 flex gap-3 rounded-2xl border-l-4 p-4 sm:p-5",
                isTip
                  ? "border-l-primary bg-primary/8"
                  : "border-l-neutral-400 bg-white",
              )}
            >
              <MaterialIcon
                name={isTip ? "lightbulb" : "info"}
                filled
                className={cn(
                  "mt-0.5 shrink-0 text-[22px]",
                  isTip ? "text-primary" : "text-neutral-500",
                )}
              />
              <div className="min-w-0">
                <p className="mb-1 text-sm font-semibold text-neutral-950">{block.title}</p>
                <p className="text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                  {block.text}
                </p>
              </div>
            </aside>
          );
        }

        return (
          <p
            key={idx}
            className="mb-4 text-[15px] leading-[1.8] text-neutral-600 sm:text-base sm:leading-[1.85]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
