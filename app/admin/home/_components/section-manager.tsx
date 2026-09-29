"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { formatTaka } from "@/lib/mart-mock/store";
import {
  blankCategoryTile,
  blankFaq,
  blankPerk,
  blankReview,
  blankTrustItem,
  catalogChoices,
  productsForSlugs,
  readHomeSections,
  saveHomeSections,
  type CategoryTile,
  type FaqItem,
  type HomeSections,
  type ReviewItem,
  type TrustItem,
} from "@/lib/mart-mock/home-sections";
import { useHomeSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  adminFieldClass,
  AdminPageHeader,
  FieldLabel,
} from "../../_components/admin-ui";
import { ImageField } from "../../_components/image-field";
import { HOME_CMS, findCmsSection } from "../../_config/cms";

const ICON_OPTIONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "local_offer",
  "campaign",
  "shield",
  "support_agent",
  "schedule",
] as const;

export function HomeSectionManager({ sectionId }: { sectionId: string }) {
  const section = findCmsSection(HOME_CMS, sectionId);
  const data = useHomeSections();
  if (!section) return null;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={section.label}
        description={section.description}
        action={<ViewSite />}
      />
      {sectionId === "trust" ? <TrustEditor items={data.trust} /> : null}
      {sectionId === "categories" ? <CategoriesEditor data={data} /> : null}
      {sectionId === "featured" ? <FeaturedEditor data={data} /> : null}
      {sectionId === "showcase" ? <ShowcaseEditor data={data} /> : null}
      {sectionId === "reviews" ? <ReviewsEditor data={data} /> : null}
      {sectionId === "faq" ? <FaqEditor data={data} /> : null}
      {sectionId === "newsletter" ? <NewsletterEditor data={data} /> : null}
    </div>
  );
}

function ViewSite() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-white hover:text-neutral-950"
    >
      View on site
      <MaterialIcon name="open_in_new" className="text-[18px]" />
    </a>
  );
}

function commit(next: HomeSections) {
  saveHomeSections(next);
}

function TrustEditor({ items }: { items: TrustItem[] }) {
  return (
    <RecordBoard
      countLabel={`${items.length} ${items.length === 1 ? "promise" : "promises"}`}
      onCreate={() => {
        const doc = readHomeSections();
        const item = blankTrustItem();
        commit({ ...doc, trust: [...doc.trust, item] });
        return item.id;
      }}
      records={items.map((item) => ({
        id: item.id,
        title: item.label || "Untitled promise",
        meta: item.href,
        icon: item.icon,
      }))}
      onDelete={(id) => {
        const doc = readHomeSections();
        commit({ ...doc, trust: doc.trust.filter((item) => item.id !== id) });
      }}
      onMove={(id, direction) => {
        const doc = readHomeSections();
        commit({ ...doc, trust: shiftById(doc.trust, id, direction) });
      }}
      renderForm={(id) => <TrustForm id={id} />}
    />
  );
}

function TrustForm({ id }: { id: string }) {
  const doc = useHomeSections();
  const item = doc.trust.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(patch: Partial<TrustItem>) {
    const current = readHomeSections();
    commit({
      ...current,
      trust: current.trust.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    });
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Label" value={item.label} onChange={(label) => update({ label })} />
      <TextField label="Link" value={item.href} onChange={(href) => update({ href })} />
      <div className="sm:col-span-2">
        <IconField value={item.icon} onChange={(icon) => update({ icon })} />
      </div>
    </div>
  );
}

function CategoriesEditor({ data }: { data: HomeSections }) {
  return (
    <div className="space-y-4">
      <Panel>
        <TextField
          label="Heading"
          value={data.categories.heading}
          onChange={(heading) => {
            const doc = readHomeSections();
            commit({ ...doc, categories: { ...doc.categories, heading } });
          }}
        />
      </Panel>
      <RecordBoard
        countLabel={`${data.categories.tiles.length} ${data.categories.tiles.length === 1 ? "tile" : "tiles"}`}
        onCreate={() => {
          const doc = readHomeSections();
          const tile = blankCategoryTile();
          commit({ ...doc, categories: { ...doc.categories, tiles: [...doc.categories.tiles, tile] } });
          return tile.id;
        }}
        records={data.categories.tiles.map((tile) => ({
          id: tile.id,
          title: tile.label || "Untitled tile",
          meta: tile.href,
          imageSrc: tile.imageSrc,
        }))}
        onDelete={(id) => {
          const doc = readHomeSections();
          commit({
            ...doc,
            categories: { ...doc.categories, tiles: doc.categories.tiles.filter((tile) => tile.id !== id) },
          });
        }}
        onMove={(id, direction) => {
          const doc = readHomeSections();
          commit({
            ...doc,
            categories: { ...doc.categories, tiles: shiftById(doc.categories.tiles, id, direction) },
          });
        }}
        renderForm={(id) => <CategoryForm id={id} />}
      />
    </div>
  );
}

function CategoryForm({ id }: { id: string }) {
  const doc = useHomeSections();
  const tile = doc.categories.tiles.find((entry) => entry.id === id);
  if (!tile) return <MissingRecord />;
  function update(patch: Partial<CategoryTile>) {
    const current = readHomeSections();
    commit({
      ...current,
      categories: {
        ...current.categories,
        tiles: current.categories.tiles.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      },
    });
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Label" value={tile.label} onChange={(label) => update({ label })} />
      <TextField label="Link" value={tile.href} onChange={(href) => update({ href })} />
      <div className="sm:col-span-2">
        <ImageField value={tile.imageSrc} onChange={(imageSrc) => update({ imageSrc })} />
      </div>
    </div>
  );
}

function FeaturedEditor({ data }: { data: HomeSections }) {
  const products = productsForSlugs(data.featured.slugs);

  function patch(partial: Partial<HomeSections["featured"]>) {
    const doc = readHomeSections();
    commit({ ...doc, featured: { ...doc.featured, ...partial } });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Heading" value={data.featured.heading} onChange={(heading) => patch({ heading })} />
          <TextField label="View all label" value={data.featured.viewAllLabel} onChange={(viewAllLabel) => patch({ viewAllLabel })} />
          <div className="sm:col-span-2">
            <TextField label="View all link" value={data.featured.viewAllHref} onChange={(viewAllHref) => patch({ viewAllHref })} />
          </div>
        </div>
      </Panel>
      <RecordBoard
        countLabel={`${products.length} ${products.length === 1 ? "product" : "products"}`}
        onCreate={() => {
          const doc = readHomeSections();
          const used = new Set(doc.featured.slugs);
          const next = catalogChoices().find((item) => !used.has(item.slug));
          if (!next) return "";
          commit({ ...doc, featured: { ...doc.featured, slugs: [...doc.featured.slugs, next.slug] } });
          return next.slug;
        }}
        records={products.map((product) => ({
          id: product.slug,
          title: product.title,
          meta: formatTaka(product.price),
          imageSrc: product.imageSrc,
        }))}
        onDelete={(slug) => patch({ slugs: data.featured.slugs.filter((item) => item !== slug) })}
        onMove={(slug, direction) => {
          const index = data.featured.slugs.indexOf(slug);
          patch({ slugs: moveItem(data.featured.slugs, index, direction) });
        }}
        renderForm={(slug) => <FeaturedProductForm slug={slug} />}
      />
    </div>
  );
}

function FeaturedProductForm({ slug }: { slug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const product = productsForSlugs([slug])[0];

  function change(nextSlug: string) {
    const doc = readHomeSections();
    if (doc.featured.slugs.includes(nextSlug)) return;
    commit({
      ...doc,
      featured: {
        ...doc.featured,
        slugs: doc.featured.slugs.map((item) => (item === slug ? nextSlug : item)),
      },
    });
    const params = new URLSearchParams(window.location.search);
    params.set("edit", nextSlug);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <div className="grid gap-4">
      <div>
        <FieldLabel htmlFor="featured-product">Product</FieldLabel>
        <select
          id="featured-product"
          value={slug}
          onChange={(event) => change(event.target.value)}
          className={adminFieldClass}
        >
          {catalogChoices().map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      {product ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f8] p-3">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image src={product.imageSrc} alt="" fill sizes="64px" className="object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-neutral-950">{product.title}</span>
            <span className="mt-0.5 block text-xs text-neutral-500">{formatTaka(product.price)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ShowcaseEditor({ data }: { data: HomeSections }) {
  const pathname = usePathname();
  const router = useRouter();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const next = new URLSearchParams(window.location.search);
    let changed = false;
    for (const row of data.showcase) {
      const key = `row-${row.id}`;
      if (!next.get(key) && row.slugs[0]) {
        next.set(key, row.slugs[0]);
        changed = true;
      }
    }
    if (changed) router.replace(`${pathname}?${next}`, { scroll: false });
  }, [data.showcase, pathname, router]);

  return (
    <div className="space-y-8">
      {data.showcase.map((row) => (
        <ShowcaseRowEditor key={row.id} rowId={row.id} />
      ))}
    </div>
  );
}

function ShowcaseRowEditor({ rowId }: { rowId: HomeSections["showcase"][number]["id"] }) {
  const data = useHomeSections();
  const row = data.showcase.find((item) => item.id === rowId);
  if (!row) return null;
  const products = productsForSlugs(row.slugs);
  const choices = catalogChoices().filter((item) => item.categoryId === rowId);

  function patch(partial: Partial<typeof row>) {
    const doc = readHomeSections();
    commit({
      ...doc,
      showcase: doc.showcase.map((item) => (item.id === rowId ? { ...item, ...partial } : item)),
    });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Heading" value={row.heading} onChange={(heading) => patch({ heading })} />
          <TextField label="View all link" value={row.href} onChange={(href) => patch({ href })} />
        </div>
      </Panel>
      <RecordBoard
        queryKey={`row-${rowId}`}
        autoOpen={false}
        countLabel={`${products.length} ${products.length === 1 ? "product" : "products"}`}
        onCreate={() => {
          const doc = readHomeSections();
          const current = doc.showcase.find((item) => item.id === rowId);
          if (!current) return "";
          const used = new Set(current.slugs);
          const next = choices.find((item) => !used.has(item.slug));
          if (!next) return "";
          commit({
            ...doc,
            showcase: doc.showcase.map((item) =>
              item.id === rowId ? { ...item, slugs: [...item.slugs, next.slug] } : item,
            ),
          });
          return next.slug;
        }}
        records={products.map((product) => ({
          id: product.slug,
          title: product.title,
          meta: formatTaka(product.price),
          imageSrc: product.imageSrc,
        }))}
        onDelete={(slug) => patch({ slugs: row.slugs.filter((item) => item !== slug) })}
        onMove={(slug, direction) => {
          const index = row.slugs.indexOf(slug);
          patch({ slugs: moveItem(row.slugs, index, direction) });
        }}
        renderForm={(slug) => <ShowcaseProductForm rowId={rowId} slug={slug} />}
      />
    </div>
  );
}

function ShowcaseProductForm({
  rowId,
  slug,
}: {
  rowId: HomeSections["showcase"][number]["id"];
  slug: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const product = productsForSlugs([slug])[0];
  const choices = catalogChoices().filter((item) => item.categoryId === rowId);

  function change(nextSlug: string) {
    const doc = readHomeSections();
    const row = doc.showcase.find((item) => item.id === rowId);
    if (!row || row.slugs.includes(nextSlug)) return;
    commit({
      ...doc,
      showcase: doc.showcase.map((item) =>
        item.id === rowId ? { ...item, slugs: item.slugs.map((entry) => (entry === slug ? nextSlug : entry)) } : item,
      ),
    });
    const params = new URLSearchParams(window.location.search);
    params.set(`row-${rowId}`, nextSlug);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <div className="grid gap-4">
      <div>
        <FieldLabel htmlFor={`showcase-${rowId}`}>Product</FieldLabel>
        <select
          id={`showcase-${rowId}`}
          value={slug}
          onChange={(event) => change(event.target.value)}
          className={adminFieldClass}
        >
          {choices.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      {product ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f8] p-3">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image src={product.imageSrc} alt="" fill sizes="64px" className="object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-neutral-950">{product.title}</span>
            <span className="mt-0.5 block text-xs text-neutral-500">{formatTaka(product.price)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ReviewsEditor({ data }: { data: HomeSections }) {
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={data.reviews.kicker}
            onChange={(kicker) => {
              const doc = readHomeSections();
              commit({ ...doc, reviews: { ...doc.reviews, kicker } });
            }}
          />
          <TextField
            label="Title"
            value={data.reviews.title}
            onChange={(title) => {
              const doc = readHomeSections();
              commit({ ...doc, reviews: { ...doc.reviews, title } });
            }}
          />
          <div className="sm:col-span-2">
            <AreaField
              label="Subtitle"
              value={data.reviews.subtitle}
              onChange={(subtitle) => {
                const doc = readHomeSections();
                commit({ ...doc, reviews: { ...doc.reviews, subtitle } });
              }}
            />
          </div>
        </div>
      </Panel>
      <RecordBoard
        countLabel={`${data.reviews.items.length} ${data.reviews.items.length === 1 ? "review" : "reviews"}`}
        onCreate={() => {
          const doc = readHomeSections();
          const item = blankReview();
          commit({ ...doc, reviews: { ...doc.reviews, items: [...doc.reviews.items, item] } });
          return item.id;
        }}
        records={data.reviews.items.map((item) => ({
          id: item.id,
          title: item.product || "Untitled review",
          meta: item.channel,
          imageSrc: item.imageSrc,
        }))}
        onDelete={(id) => {
          const doc = readHomeSections();
          commit({
            ...doc,
            reviews: { ...doc.reviews, items: doc.reviews.items.filter((item) => item.id !== id) },
          });
        }}
        onMove={(id, direction) => {
          const doc = readHomeSections();
          commit({
            ...doc,
            reviews: { ...doc.reviews, items: shiftById(doc.reviews.items, id, direction) },
          });
        }}
        renderForm={(id) => <ReviewForm id={id} />}
      />
    </div>
  );
}

function ReviewForm({ id }: { id: string }) {
  const doc = useHomeSections();
  const item = doc.reviews.items.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(patch: Partial<ReviewItem>) {
    const current = readHomeSections();
    commit({
      ...current,
      reviews: {
        ...current.reviews,
        items: current.reviews.items.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      },
    });
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Product" value={item.product} onChange={(product) => update({ product })} />
      <div>
        <FieldLabel htmlFor={`channel-${id}`}>Channel</FieldLabel>
        <select
          id={`channel-${id}`}
          value={item.channel}
          onChange={(event) => update({ channel: event.target.value as ReviewItem["channel"] })}
          className={adminFieldClass}
        >
          <option value="WhatsApp">WhatsApp</option>
          <option value="Messenger">Messenger</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <ImageField value={item.imageSrc} onChange={(imageSrc) => update({ imageSrc })} />
      </div>
      <div className="sm:col-span-2">
        <TextField label="Image description" value={item.imageAlt} onChange={(imageAlt) => update({ imageAlt })} />
      </div>
    </div>
  );
}

function FaqEditor({ data }: { data: HomeSections }) {
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <CopyFields
            kicker={data.faq.kicker}
            title={data.faq.title}
            subtitle={data.faq.subtitle}
            onChange={(patch) => {
              const doc = readHomeSections();
              commit({ ...doc, faq: { ...doc.faq, ...patch } });
            }}
          />
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <TextField
              label="More link label"
              value={data.faq.moreLabel}
              onChange={(moreLabel) => {
                const doc = readHomeSections();
                commit({ ...doc, faq: { ...doc.faq, moreLabel } });
              }}
            />
            <TextField
              label="More link"
              value={data.faq.moreHref}
              onChange={(moreHref) => {
                const doc = readHomeSections();
                commit({ ...doc, faq: { ...doc.faq, moreHref } });
              }}
            />
          </div>
        </div>
      </Panel>
      <RecordBoard
        countLabel={`${data.faq.items.length} ${data.faq.items.length === 1 ? "question" : "questions"}`}
        onCreate={() => {
          const doc = readHomeSections();
          const item = blankFaq();
          commit({ ...doc, faq: { ...doc.faq, items: [...doc.faq.items, item] } });
          return item.id;
        }}
        records={data.faq.items.map((item) => ({
          id: item.id,
          title: item.question || "Untitled question",
          meta: item.category || "No category",
        }))}
        onDelete={(id) => {
          const doc = readHomeSections();
          commit({ ...doc, faq: { ...doc.faq, items: doc.faq.items.filter((item) => item.id !== id) } });
        }}
        onMove={(id, direction) => {
          const doc = readHomeSections();
          commit({ ...doc, faq: { ...doc.faq, items: shiftById(doc.faq.items, id, direction) } });
        }}
        renderForm={(id) => <FaqForm id={id} />}
      />
    </div>
  );
}

function FaqForm({ id }: { id: string }) {
  const doc = useHomeSections();
  const item = doc.faq.items.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(patch: Partial<FaqItem>) {
    const current = readHomeSections();
    commit({
      ...current,
      faq: {
        ...current.faq,
        items: current.faq.items.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      },
    });
  }
  return (
    <div className="grid gap-4">
      <TextField label="Category" value={item.category} onChange={(category) => update({ category })} />
      <TextField label="Question" value={item.question} onChange={(question) => update({ question })} />
      <AreaField label="Answer" value={item.answer} onChange={(answer) => update({ answer })} />
    </div>
  );
}

function NewsletterEditor({ data }: { data: HomeSections }) {
  const content = data.newsletter;
  function patch(partial: Partial<HomeSections["newsletter"]>) {
    const doc = readHomeSections();
    commit({ ...doc, newsletter: { ...doc.newsletter, ...partial } });
  }
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Eyebrow" value={content.eyebrow} onChange={(eyebrow) => patch({ eyebrow })} />
          <TextField label="Title" value={content.title} onChange={(title) => patch({ title })} />
          <div className="sm:col-span-2">
            <AreaField label="Subtitle" value={content.subtitle} onChange={(subtitle) => patch({ subtitle })} />
          </div>
          <TextField label="Email placeholder" value={content.placeholder} onChange={(placeholder) => patch({ placeholder })} />
          <TextField label="Button" value={content.cta} onChange={(cta) => patch({ cta })} />
          <div className="sm:col-span-2">
            <TextField label="Success message" value={content.success} onChange={(success) => patch({ success })} />
          </div>
        </div>
      </Panel>
      <RecordBoard
          countLabel={`${content.perks.length} ${content.perks.length === 1 ? "perk" : "perks"}`}
          onCreate={() => {
            const item = blankPerk();
            const doc = readHomeSections();
            commit({ ...doc, newsletter: { ...doc.newsletter, perks: [...doc.newsletter.perks, item] } });
            return item.id;
          }}
          records={content.perks.map((perk) => ({
            id: perk.id,
            title: perk.label || "Untitled perk",
            meta: perk.icon,
            icon: perk.icon,
          }))}
          onDelete={(id) => patch({ perks: content.perks.filter((item) => item.id !== id) })}
          onMove={(id, direction) => {
            const index = content.perks.findIndex((item) => item.id === id);
            const next = [...content.perks];
            const target = index + direction;
            if (index < 0 || target < 0 || target >= next.length) return;
            const [item] = next.splice(index, 1);
            next.splice(target, 0, item);
            patch({ perks: next });
          }}
          renderForm={(id) => <PerkForm id={id} />}
        />
    </div>
  );
}

function PerkForm({ id }: { id: string }) {
  const doc = useHomeSections();
  const perk = doc.newsletter.perks.find((item) => item.id === id);
  if (!perk) return <MissingRecord />;
  function update(patch: Partial<typeof perk>) {
    const doc = readHomeSections();
    commit({
      ...doc,
      newsletter: {
        ...doc.newsletter,
        perks: doc.newsletter.perks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      },
    });
  }
  return (
    <div className="grid gap-4">
      <TextField label="Label" value={perk.label} onChange={(label) => update({ label })} />
      <IconField value={perk.icon} onChange={(icon) => update({ icon })} />
    </div>
  );
}

function RecordBoard({
  countLabel,
  records,
  onCreate,
  onDelete,
  onMove,
  queryKey = "edit",
  autoOpen = true,
  formTitle = "Edit",
  renderForm,
}: {
  countLabel: string;
  records: { id: string; title: string; meta: string; imageSrc?: string; icon?: string }[];
  onCreate: () => string;
  onDelete: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
  queryKey?: string;
  autoOpen?: boolean;
  formTitle?: string;
  renderForm: (id: string) => ReactNode;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get(queryKey);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const opened = useRef(false);
  const firstId = records[0]?.id;

  function open(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set(queryKey, id);
    else next.delete(queryKey);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (!autoOpen || opened.current || selected || !firstId) return;
    opened.current = true;
    open(firstId);
  }, [autoOpen, selected, firstId]);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-950">{countLabel}</p>
          <button
            type="button"
            onClick={() => {
              const id = onCreate();
              if (id) open(id);
            }}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/80"
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Add
          </button>
        </div>
        {records.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">Nothing here yet.</p>
        ) : (
          <ul>
            {records.map((record) => {
              const active = selected === record.id;
              return (
                <li key={record.id} className="border-t border-neutral-100 first:border-t-0">
                  <div className={cn("flex items-center gap-3 px-3 py-2.5", active && "bg-primary/5")}>
                    <button type="button" onClick={() => open(record.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <RecordThumb imageSrc={record.imageSrc} icon={record.icon} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{record.title}</span>
                        <span className="block truncate text-xs text-neutral-500">{record.meta}</span>
                      </span>
                    </button>
                    {onMove ? (
                      <span className="flex shrink-0">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={records[0]?.id === record.id}
                          onClick={() => onMove(record.id, -1)}
                          className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <MaterialIcon name="arrow_upward" className="text-[18px]" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={records[records.length - 1]?.id === record.id}
                          onClick={() => onMove(record.id, 1)}
                          className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <MaterialIcon name="arrow_downward" className="text-[18px]" />
                        </button>
                      </span>
                    ) : null}
                    {confirmId === record.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(record.id);
                          if (selected === record.id) open(null);
                          setConfirmId(null);
                        }}
                        className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(record.id)}
                        className="rounded-full px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5 xl:sticky xl:top-4">
        <h2 className="mb-4 text-sm font-semibold text-neutral-950">{formTitle}</h2>
        {selected ? renderForm(selected) : (
          <p className="py-8 text-center text-sm text-neutral-500">Select a record, or add one.</p>
        )}
      </section>
    </div>
  );
}

function CopyFields({
  kicker,
  title,
  subtitle,
  onChange,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  onChange: (patch: { kicker?: string; title?: string; subtitle?: string }) => void;
}) {
  return (
    <>
      <TextField label="Eyebrow" value={kicker} onChange={(value) => onChange({ kicker: value })} />
      <TextField label="Title" value={title} onChange={(value) => onChange({ title: value })} />
      <div className="sm:col-span-2">
        <AreaField label="Subtitle" value={subtitle} onChange={(value) => onChange({ subtitle: value })} />
      </div>
    </>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      {title ? <h2 className="mb-4 text-sm font-semibold text-neutral-950">{title}</h2> : null}
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={adminFieldClass} />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className={cn(adminFieldClass, "h-auto py-3")}
      />
    </div>
  );
}

function IconField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <FieldLabel>Icon</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {ICON_OPTIONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={cn(
              "grid size-10 place-items-center rounded-xl ring-1",
              value === icon ? "bg-primary/10 text-primary ring-primary/30" : "bg-white text-neutral-600 ring-neutral-200",
            )}
            aria-label={icon}
          >
            <MaterialIcon name={icon} className="text-[20px]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RecordThumb({ imageSrc, icon }: { imageSrc?: string; icon?: string }) {
  if (imageSrc) {
    return (
      <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        <Image src={imageSrc} alt="" fill sizes="44px" className="object-cover" />
      </span>
    );
  }
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f5f6f8] text-neutral-600">
      <MaterialIcon name={icon || "notes"} className="text-[20px]" />
    </span>
  );
}

function MissingRecord() {
  return <p className="text-sm text-neutral-500">This record is no longer here.</p>;
}

function shiftById<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function moveItem(items: string[], index: number, direction: -1 | 1) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return items;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function SectionManagerFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
}
