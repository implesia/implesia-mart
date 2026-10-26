"use client";

import Link from "next/link";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import {
  HOME_CMS,
  PAGE_CMS,
  SITE_CMS,
  cmsApiPath,
  type CmsPage,
  type CmsSection,
} from "../_config/cms";
import { adminButtonClass, AdminPageHeader } from "./admin-ui";

const PAGE_GROUPS: { title: string; pages: CmsPage[] }[] = [
  { title: "Pages", pages: [HOME_CMS, ...PAGE_CMS] },
  { title: "Site", pages: SITE_CMS },
];

const ALL_PAGES = PAGE_GROUPS.flatMap((group) => group.pages);

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function matches(query: string, parts: string[]) {
  if (!query) return true;
  return parts.join(" ").toLowerCase().includes(query);
}

function pageMatches(page: CmsPage, query: string) {
  return matches(query, [page.label, page.description, ...page.sections.flatMap((section) => [section.label, section.description])]);
}

function sectionMatches(section: CmsSection, query: string) {
  return matches(query, [section.label, section.description]);
}

export function CmsHub({ page }: { page: CmsPage }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const sectionTotal = ALL_PAGES.reduce((sum, item) => sum + item.sections.length, 0);
  const visibleSections = page.sections.filter((section) => sectionMatches(section, needle));

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Content Management"
        description="Manage website pages, sections, and content from one place."
        action={
          <a href={page.publicPath} target="_blank" rel="noreferrer" className={adminButtonClass.secondary}>
            View on site
            <MaterialIcon name="open_in_new" className="text-[18px]" />
          </a>
        }
      />

      <p className="text-sm text-neutral-500">
        {countLabel(ALL_PAGES.length, "page", "pages")} · {countLabel(sectionTotal, "section", "sections")}
      </p>

      <label className="relative block">
        <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages or sections"
          aria-label="Search pages or sections"
          className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle pr-10 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-500 focus:border-primary focus:ring-3 focus:ring-primary/25"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-neutral-500 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="close" className="text-[16px]" />
          </button>
        ) : null}
      </label>

      <div className="grid items-start gap-4 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        <nav aria-label="Website pages" className="min-w-0 lg:sticky lg:top-20">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {ALL_PAGES.filter((item) => pageMatches(item, needle)).map((item) => (
              <PageChip key={item.id} item={item} active={item.id === page.id} />
            ))}
          </div>
          {needle && !ALL_PAGES.some((item) => pageMatches(item, needle)) ? (
            <p className="text-sm text-neutral-500 lg:hidden">No pages match this search.</p>
          ) : null}
          <div className="hidden space-y-4 lg:block">
            {PAGE_GROUPS.map((group) => {
              const pages = group.pages.filter((item) => pageMatches(item, needle));
              if (pages.length === 0) return null;
              return (
                <div key={group.title}>
                  <p className="px-3 pb-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">{group.title}</p>
                  <ul className="space-y-1">
                    {pages.map((item) => (
                      <li key={item.id}>
                        <PageLink item={item} active={item.id === page.id} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {needle && !ALL_PAGES.some((item) => pageMatches(item, needle)) ? (
              <p className="px-3 text-sm text-neutral-500">No pages match this search.</p>
            ) : null}
          </div>
        </nav>

        <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="cms-page-heading">
          <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-admin-subtle text-neutral-700">
                <MaterialIcon name={page.icon} className="text-[22px]" />
              </span>
              <div className="min-w-0">
                <h2 id="cms-page-heading" className="text-lg font-semibold text-neutral-950">
                  {page.label}
                </h2>
                <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">{page.description}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {countLabel(page.sections.length, "section", "sections")} · listed in page order
                </p>
              </div>
            </div>
          </div>

          {visibleSections.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-neutral-500">
              {needle ? `No sections on ${page.label} match this search.` : "No sections are configured for this page."}
            </p>
          ) : (
            <ol>
              {visibleSections.map((section) => {
                const position = page.sections.findIndex((item) => item.id === section.id) + 1;
                return (
                  <li key={section.id} className="border-b border-neutral-100 last:border-b-0">
                    <Link
                      href={`${page.href}/${section.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 sm:px-5"
                    >
                      <span className="w-6 shrink-0 text-right text-xs text-neutral-500 tabular-nums">{position}</span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-admin-subtle text-neutral-700">
                        <MaterialIcon name={section.icon} className="text-[22px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-neutral-950">{section.label}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-neutral-500">{section.description}</span>
                        <span className="mt-1 block truncate font-mono text-[11px] text-neutral-500">{cmsApiPath(page, section)}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary">
                        Edit
                        <MaterialIcon name="chevron_right" className="text-[18px]" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function PageLink({ item, active }: { item: CmsPage; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "bg-white font-semibold text-neutral-950 ring-1 ring-neutral-200" : "text-neutral-600 hover:bg-white/80 hover:text-neutral-950",
      )}
    >
      <MaterialIcon name={item.icon} className={cn("text-[20px]", active ? "text-primary" : "text-neutral-500")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{item.label}</span>
        <span className={cn("block text-xs font-normal", active ? "text-neutral-500" : "text-neutral-500")}>
          {countLabel(item.sections.length, "section", "sections")}
        </span>
      </span>
    </Link>
  );
}

function PageChip({ item, active }: { item: CmsPage; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "bg-neutral-950 font-medium text-white" : "bg-white font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
      )}
    >
      {item.label}
      <span className={cn("text-xs tabular-nums", active ? "text-white/70" : "text-neutral-500")}>{item.sections.length}</span>
    </Link>
  );
}

export function CmsNotFound({ title, href, back }: { title: string; href: string; back: string }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-10 text-center ring-1 ring-neutral-200/90">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <Link href={href} className="mt-3 inline-flex text-sm font-medium text-primary">
        {back}
      </Link>
    </div>
  );
}
