import Link from "next/link";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";

import { cmsApiPath, type CmsPage, type CmsSection } from "../_config/cms";
import { AdminCard, AdminPageHeader } from "./admin-ui";

export function CmsSectionPage({
  page,
  section,
}: {
  page: CmsPage;
  section: CmsSection;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-500">
        <Link href={page.href} className="hover:text-neutral-950">
          {page.label}
        </Link>
        <MaterialIcon name="chevron_right" className="text-[16px] text-neutral-300" />
        <span className="text-neutral-950">{section.label}</span>
      </div>

      <AdminPageHeader
        title={section.label}
        description={section.description}
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

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Section API
          </p>
          <p className="mt-2 font-mono text-sm font-semibold text-neutral-950">
            {cmsApiPath(page, section)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            GET reads this block. PUT saves it. One section, one endpoint, so the home hero never overwrites the about hero.
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Fields
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {section.fields.map((field) => (
              <span
                key={field}
                className="rounded-full bg-[#f5f6f8] px-2.5 py-1 font-mono text-[11px] text-neutral-600"
              >
                {field}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            These fields open here once the editor API is connected. The structure is locked.
          </p>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <MaterialIcon name={section.icon} className="text-[22px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-950">
              {page.label} → {section.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">
              This block is its own storefront component. Content will come from{" "}
              <span className="font-mono text-[12px] text-neutral-700">
                {cmsApiPath(page, section)}
              </span>
              . Mock data still lives on the client.
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
