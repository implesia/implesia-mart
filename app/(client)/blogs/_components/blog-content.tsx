import type { BlogContentBlock } from "../../_data/blogs/blogs";

export function BlogContent({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="max-w-none">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h2
              key={idx}
              className="mt-8 mb-3 text-lg font-semibold text-on-surface sm:text-xl"
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
                  <span className="text-sm leading-relaxed text-on-surface sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={idx}
            className="mb-4 text-sm leading-relaxed text-on-surface-variant sm:text-base"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
