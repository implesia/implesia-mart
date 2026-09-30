import Link from "next/link";
import type { ReactNode } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import { adminButtonClass, AdminPageHeader } from "../../_components/admin-ui";
import { HOME_CMS } from "../../_config/cms";

export function HomeCmsHeader({
  title,
  description,
  sectionId,
  extra,
  autosave = false,
}: {
  title: string;
  description?: string;
  sectionId: string;
  extra?: ReactNode;
  autosave?: boolean;
}) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
        <Link href="/admin/home" className="font-medium hover:text-neutral-950">
          Home CMS
        </Link>
        <MaterialIcon name="chevron_right" className="text-[16px] text-neutral-300" />
        <span className="font-medium text-neutral-950">{title}</span>
      </nav>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Home sections">
        {HOME_CMS.sections.map((section) => {
          const active = section.id === sectionId;
          return (
            <Link
              key={section.id}
              href={`${HOME_CMS.href}/${section.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active ? "bg-neutral-950 font-medium text-white" : "bg-white font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
      <AdminPageHeader
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className={adminButtonClass.secondary}>
              View on site
              <MaterialIcon name="open_in_new" className="text-[18px]" />
            </a>
            {extra}
          </div>
        }
      />
      {autosave ? <p className="-mt-3 mb-4 text-xs text-neutral-400">Changes save as you edit.</p> : null}
    </div>
  );
}
