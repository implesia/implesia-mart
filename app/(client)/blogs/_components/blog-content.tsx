import type { BlogBlock } from "@/lib/mart-mock/blog-sections";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

export function BlogContent({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="max-w-none">
      {blocks.map((block) => {
        if (block.type === "heading") {
          return (
            <h2
              key={block.id}
              id={`section-${block.id}`}
              className="mt-8 mb-3 scroll-mt-28 text-xl font-semibold tracking-tight text-neutral-950 sm:mt-10 sm:text-2xl"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={block.id} className="my-4 space-y-2.5">
              {block.items.map((item, itemIdx) => (
                <li key={`${block.id}-${itemIdx}`} className="flex items-start gap-3">
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
              key={block.id}
              className={cn(
                "my-5 flex gap-3 rounded-2xl border-l-4 p-4 sm:p-5",
                isTip ? "border-l-primary bg-primary/8" : "border-l-neutral-400 bg-white",
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
            key={block.id}
            className="mb-4 text-[15px] leading-[1.8] text-neutral-600 sm:text-base sm:leading-[1.85]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
