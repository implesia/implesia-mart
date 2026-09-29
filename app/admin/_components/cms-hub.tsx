import Link from "next/link";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import { cmsApiPath, type CmsPage } from "../_config/cms";
import { AdminPageHeader } from "./admin-ui";

export function CmsHub({ page }: { page: CmsPage }) {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={page.label}
        description={page.description}
        action={
          <a
            href={page.publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            View on site
            <MaterialIcon name="open_in_new" className="text-[18px]" />
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200/90">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary">
          {cmsApiPath(page)}
        </span>
        <p className="text-sm text-neutral-500">
          Each card is its own section. Open one to edit that block.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {page.sections.map((section, index) => (
          <Link
            key={section.id}
            href={`${page.href}/${section.id}`}
            className="group flex flex-col rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 transition-colors hover:bg-neutral-50 hover:ring-neutral-300"
          >
            <span className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f6f8] text-neutral-700 group-hover:bg-primary/10 group-hover:text-primary">
                <MaterialIcon name={section.icon} className="text-[22px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-950">
                    {section.label}
                  </span>
                  <span className="text-xs tabular-nums text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-neutral-500">
                  {section.description}
                </span>
              </span>
            </span>
            <span className="mt-4 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-neutral-400">
                {cmsApiPath(page, section)}
              </span>
              <MaterialIcon
                name="chevron_right"
                className="text-[20px] text-neutral-300 group-hover:text-primary"
              />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CmsNotFound({
  title,
  href,
  back,
}: {
  title: string;
  href: string;
  back: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-neutral-200/90">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <Link
        href={href}
        className={cn("mt-3 inline-flex text-sm font-medium text-primary")}
      >
        {back}
      </Link>
    </div>
  );
}
