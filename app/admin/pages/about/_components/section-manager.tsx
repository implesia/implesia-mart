"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankAboutImage,
  blankFeature,
  blankParagraph,
  blankStat,
  blankStep,
  readAboutSections,
  saveAboutSections,
  type AboutCard,
  type AboutFeatureItem,
  type AboutImage,
  type AboutLink,
  type AboutSections,
  type AboutStatItem,
  type AboutStepItem,
} from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  adminFieldClass,
  AdminPageHeader,
  FieldLabel,
} from "../../../_components/admin-ui";
import { ImageField } from "../../../_components/image-field";
import { findCmsPage, findCmsSection } from "../../../_config/cms";

const ICON_OPTIONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "category",
  "location_on",
  "design_services",
  "back_hand",
  "checkroom",
  "visibility",
  "rocket_launch",
  "search",
  "task_alt",
  "storefront",
  "support_agent",
  "favorite",
  "shield",
] as const;

export function AboutSectionManager({ sectionId }: { sectionId: string }) {
  const page = findCmsPage("about");
  const section = page ? findCmsSection(page, sectionId) : undefined;
  if (!section) return null;

  return (
    <div className="space-y-4">
      {sectionId === "hero" ? (
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">Hero</h1>
          <ViewSite />
        </div>
      ) : (
        <AdminPageHeader
          title={section.label}
          description={section.description}
          action={<ViewSite />}
        />
      )}
      {sectionId === "hero" ? <HeroEditor /> : null}
      {sectionId === "stats" ? <StatsEditor /> : null}
      {sectionId === "story" ? <StoryEditor /> : null}
      {sectionId === "custom-dresses" ? <DressesEditor /> : null}
      {sectionId === "mission" ? <MissionEditor /> : null}
      {sectionId === "values" ? <ValuesEditor /> : null}
      {sectionId === "how-it-works" ? <StepsEditor /> : null}
      {sectionId === "cta" ? <CtaEditor /> : null}
    </div>
  );
}

function ViewSite() {
  return (
    <a
      href="/about-us"
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-white hover:text-neutral-950"
    >
      View on site
      <MaterialIcon name="open_in_new" className="text-[18px]" />
    </a>
  );
}

function commit(next: AboutSections) {
  saveAboutSections(next);
}

function HeroEditor() {
  const { hero } = useAboutSections();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const left = hero.images[0];
  const right = hero.images[1];

  useEffect(() => {
    if (!params.get("image")) return;
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router]);

  function patch(partial: Partial<AboutSections["hero"]>) {
    const doc = readAboutSections();
    commit({ ...doc, hero: { ...doc.hero, ...partial } });
  }

  function setPhoto(index: 0 | 1, partial: Partial<AboutImage>) {
    const doc = readAboutSections();
    const images = doc.hero.images.map((image) => ({ ...image }));
    while (images.length <= index) images.push(blankAboutImage());
    images[index] = { ...images[index], ...partial };
    commit({ ...doc, hero: { ...doc.hero, images } });
  }

  return (
    <div className="space-y-4">
      <HeroPreview hero={hero} />
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <div className="grid gap-4">
          <TextField label="Label" value={hero.eyebrow} onChange={(eyebrow) => patch({ eyebrow })} />
          <TextField label="Headline" value={hero.title} onChange={(title) => patch({ title })} />
          <AreaField label="Text" value={hero.subtitle} onChange={(subtitle) => patch({ subtitle })} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
          <ButtonPair
            title="First button"
            value={hero.primaryCta}
            onChange={(primaryCta) => patch({ primaryCta })}
          />
          <ButtonPair
            title="Second button"
            value={hero.secondaryCta}
            onChange={(secondaryCta) => patch({ secondaryCta })}
          />
        </div>
        <div className="mt-6 grid gap-4 border-t border-neutral-100 pt-6 lg:grid-cols-2">
          <PhotoPair title="Left photo" image={left} onChange={(partial) => setPhoto(0, partial)} />
          <PhotoPair title="Right photo" image={right} onChange={(partial) => setPhoto(1, partial)} />
        </div>
      </section>
    </div>
  );
}

function HeroPreview({ hero }: { hero: AboutSections["hero"] }) {
  const photos = [hero.images[0], hero.images[1]];
  return (
    <div className="grid overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-xs font-medium text-primary">{hero.eyebrow}</p>
        <p className="mt-2 text-xl leading-snug font-semibold text-white sm:text-2xl">{hero.title}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{hero.subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {hero.primaryCta.label ? (
            <span className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white">
              {hero.primaryCta.label}
            </span>
          ) : null}
          {hero.secondaryCta.label ? (
            <span className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white ring-1 ring-white/25">
              {hero.secondaryCta.label}
            </span>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 sm:p-5">
        {photos.map((photo, index) => (
          <div
            key={photo?.id ?? index}
            className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
          >
            {photo?.src ? (
              <Image src={photo.src} alt="" fill sizes="180px" className="object-cover" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonPair({
  title,
  value,
  onChange,
}: {
  title: string;
  value: AboutLink;
  onChange: (next: AboutLink) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-neutral-950">{title}</p>
      <TextField label="Text" value={value.label} onChange={(label) => onChange({ ...value, label })} />
      <TextField label="Link" value={value.href} onChange={(href) => onChange({ ...value, href })} />
    </div>
  );
}

function PhotoPair({
  title,
  image,
  onChange,
}: {
  title: string;
  image?: AboutImage;
  onChange: (partial: Partial<AboutImage>) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-neutral-950">{title}</p>
      <ImageField compact label="" value={image?.src ?? ""} onChange={(src) => onChange({ src })} />
      <TextField label="Description" value={image?.alt ?? ""} onChange={(alt) => onChange({ alt })} />
    </div>
  );
}

function StatsEditor() {
  const { stats } = useAboutSections();
  return (
    <RecordBoard
      countLabel={`${stats.length} ${stats.length === 1 ? "stat" : "stats"}`}
      onCreate={() => {
        const doc = readAboutSections();
        const item = blankStat();
        commit({ ...doc, stats: [...doc.stats, item] });
        return item.id;
      }}
      records={stats.map((item) => ({
        id: item.id,
        title: item.label || "Untitled stat",
        meta: item.value,
        icon: item.icon,
      }))}
      onDelete={(id) => {
        const doc = readAboutSections();
        commit({ ...doc, stats: doc.stats.filter((item) => item.id !== id) });
      }}
      onMove={(id, direction) => {
        const doc = readAboutSections();
        commit({ ...doc, stats: shiftById(doc.stats, id, direction) });
      }}
      renderForm={(id) => <StatForm id={id} />}
    />
  );
}

function StatForm({ id }: { id: string }) {
  const { stats } = useAboutSections();
  const item = stats.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(patch: Partial<AboutStatItem>) {
    const doc = readAboutSections();
    commit({
      ...doc,
      stats: doc.stats.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    });
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Value"
        value={item.value}
        onChange={(value) => update({ value })}
      />
      <TextField
        label="Label"
        value={item.label}
        onChange={(label) => update({ label })}
      />
      <div className="sm:col-span-2">
        <IconField value={item.icon} onChange={(icon) => update({ icon })} />
      </div>
    </div>
  );
}

function StoryEditor() {
  const { story } = useAboutSections();

  function patch(partial: Partial<AboutSections["story"]>) {
    const doc = readAboutSections();
    commit({ ...doc, story: { ...doc.story, ...partial } });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={story.kicker}
            onChange={(kicker) => patch({ kicker })}
          />
          <TextField
            label="Title"
            value={story.title}
            onChange={(title) => patch({ title })}
          />
          <div className="sm:col-span-2">
            <LinkFields
              label="Button"
              value={story.cta}
              onChange={(cta) => patch({ cta })}
            />
          </div>
        </div>
      </Panel>
      <RecordBoard
        queryKey="paragraph"
        countLabel={`${story.paragraphs.length} ${story.paragraphs.length === 1 ? "paragraph" : "paragraphs"}`}
        onCreate={() => {
          const doc = readAboutSections();
          const item = blankParagraph();
          commit({
            ...doc,
            story: {
              ...doc.story,
              paragraphs: [...doc.story.paragraphs, item],
            },
          });
          return item.id;
        }}
        records={story.paragraphs.map((item, index) => ({
          id: item.id,
          title: item.text || "Empty paragraph",
          meta: `Paragraph ${index + 1}`,
        }))}
        onDelete={(id) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            story: {
              ...doc.story,
              paragraphs: doc.story.paragraphs.filter((item) => item.id !== id),
            },
          });
        }}
        onMove={(id, direction) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            story: {
              ...doc.story,
              paragraphs: shiftById(doc.story.paragraphs, id, direction),
            },
          });
        }}
        renderForm={(id) => <ParagraphForm id={id} />}
      />
      <ImageBoard
        images={story.images}
        autoOpen={false}
        onCreate={() => {
          const doc = readAboutSections();
          const image = blankAboutImage();
          commit({
            ...doc,
            story: { ...doc.story, images: [...doc.story.images, image] },
          });
          return image.id;
        }}
        onDelete={(id) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            story: {
              ...doc.story,
              images: doc.story.images.filter((item) => item.id !== id),
            },
          });
        }}
        onMove={(id, direction) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            story: {
              ...doc.story,
              images: shiftById(doc.story.images, id, direction),
            },
          });
        }}
        renderForm={(id) => <ImageForm id={id} scope="story" />}
      />
    </div>
  );
}

function ParagraphForm({ id }: { id: string }) {
  const { story } = useAboutSections();
  const item = story.paragraphs.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(text: string) {
    const doc = readAboutSections();
    commit({
      ...doc,
      story: {
        ...doc.story,
        paragraphs: doc.story.paragraphs.map((entry) =>
          entry.id === id ? { ...entry, text } : entry,
        ),
      },
    });
  }
  return <AreaField label="Paragraph" value={item.text} onChange={update} />;
}

function DressesEditor() {
  const { customDresses } = useAboutSections();

  function patch(partial: Partial<AboutSections["customDresses"]>) {
    const doc = readAboutSections();
    commit({ ...doc, customDresses: { ...doc.customDresses, ...partial } });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={customDresses.kicker}
            onChange={(kicker) => patch({ kicker })}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Title"
              value={customDresses.title}
              onChange={(title) => patch({ title })}
            />
          </div>
          <div className="sm:col-span-2">
            <AreaField
              label="Subtitle"
              value={customDresses.subtitle}
              onChange={(subtitle) => patch({ subtitle })}
            />
          </div>
          <LinkFields
            label="Primary button"
            value={customDresses.primaryCta}
            onChange={(primaryCta) => patch({ primaryCta })}
          />
          <LinkFields
            label="Secondary button"
            value={customDresses.secondaryCta}
            onChange={(secondaryCta) => patch({ secondaryCta })}
          />
        </div>
      </Panel>
      <RecordBoard
        queryKey="feature"
        countLabel={`${customDresses.features.length} ${customDresses.features.length === 1 ? "feature" : "features"}`}
        onCreate={() => {
          const doc = readAboutSections();
          const item = blankFeature();
          commit({
            ...doc,
            customDresses: {
              ...doc.customDresses,
              features: [...doc.customDresses.features, item],
            },
          });
          return item.id;
        }}
        records={customDresses.features.map((item) => ({
          id: item.id,
          title: item.title || "Untitled feature",
          meta: item.description,
          icon: item.icon,
        }))}
        onDelete={(id) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            customDresses: {
              ...doc.customDresses,
              features: doc.customDresses.features.filter(
                (item) => item.id !== id,
              ),
            },
          });
        }}
        onMove={(id, direction) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            customDresses: {
              ...doc.customDresses,
              features: shiftById(doc.customDresses.features, id, direction),
            },
          });
        }}
        renderForm={(id) => <FeatureForm id={id} scope="dresses" />}
      />
      <ImageBoard
        images={customDresses.gallery}
        queryKey="gallery"
        autoOpen={false}
        noun="photo"
        onCreate={() => {
          const doc = readAboutSections();
          const image = blankAboutImage();
          commit({
            ...doc,
            customDresses: {
              ...doc.customDresses,
              gallery: [...doc.customDresses.gallery, image],
            },
          });
          return image.id;
        }}
        onDelete={(id) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            customDresses: {
              ...doc.customDresses,
              gallery: doc.customDresses.gallery.filter(
                (item) => item.id !== id,
              ),
            },
          });
        }}
        onMove={(id, direction) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            customDresses: {
              ...doc.customDresses,
              gallery: shiftById(doc.customDresses.gallery, id, direction),
            },
          });
        }}
        renderForm={(id) => <ImageForm id={id} scope="gallery" />}
      />
    </div>
  );
}

function MissionEditor() {
  const { mission } = useAboutSections();

  function update(key: "vision" | "mission", patch: Partial<AboutCard>) {
    const doc = readAboutSections();
    commit({
      ...doc,
      mission: { ...doc.mission, [key]: { ...doc.mission[key], ...patch } },
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CardFields
        title="Vision"
        card={mission.vision}
        onChange={(patch) => update("vision", patch)}
      />
      <CardFields
        title="Mission"
        card={mission.mission}
        onChange={(patch) => update("mission", patch)}
      />
    </div>
  );
}

function CardFields({
  title,
  card,
  onChange,
}: {
  title: string;
  card: AboutCard;
  onChange: (patch: Partial<AboutCard>) => void;
}) {
  return (
    <Panel title={title}>
      <div className="grid gap-4">
        <TextField
          label="Title"
          value={card.title}
          onChange={(value) => onChange({ title: value })}
        />
        <AreaField
          label="Description"
          value={card.description}
          onChange={(description) => onChange({ description })}
        />
        <IconField value={card.icon} onChange={(icon) => onChange({ icon })} />
      </div>
    </Panel>
  );
}

function ValuesEditor() {
  const { values } = useAboutSections();

  function patch(partial: Partial<AboutSections["values"]>) {
    const doc = readAboutSections();
    commit({ ...doc, values: { ...doc.values, ...partial } });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={values.kicker}
            onChange={(kicker) => patch({ kicker })}
          />
          <TextField
            label="Title"
            value={values.title}
            onChange={(title) => patch({ title })}
          />
          <div className="sm:col-span-2">
            <AreaField
              label="Subtitle"
              value={values.subtitle}
              onChange={(subtitle) => patch({ subtitle })}
            />
          </div>
        </div>
      </Panel>
      <RecordBoard
        countLabel={`${values.items.length} ${values.items.length === 1 ? "value" : "values"}`}
        onCreate={() => {
          const doc = readAboutSections();
          const item = blankFeature();
          commit({
            ...doc,
            values: { ...doc.values, items: [...doc.values.items, item] },
          });
          return item.id;
        }}
        records={values.items.map((item) => ({
          id: item.id,
          title: item.title || "Untitled value",
          meta: item.description,
          icon: item.icon,
        }))}
        onDelete={(id) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            values: {
              ...doc.values,
              items: doc.values.items.filter((item) => item.id !== id),
            },
          });
        }}
        onMove={(id, direction) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            values: {
              ...doc.values,
              items: shiftById(doc.values.items, id, direction),
            },
          });
        }}
        renderForm={(id) => <FeatureForm id={id} scope="values" />}
      />
    </div>
  );
}

function StepsEditor() {
  const { howItWorks } = useAboutSections();

  function patch(partial: Partial<AboutSections["howItWorks"]>) {
    const doc = readAboutSections();
    commit({ ...doc, howItWorks: { ...doc.howItWorks, ...partial } });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={howItWorks.kicker}
            onChange={(kicker) => patch({ kicker })}
          />
          <TextField
            label="Title"
            value={howItWorks.title}
            onChange={(title) => patch({ title })}
          />
          <div className="sm:col-span-2">
            <AreaField
              label="Subtitle"
              value={howItWorks.subtitle}
              onChange={(subtitle) => patch({ subtitle })}
            />
          </div>
        </div>
      </Panel>
      <RecordBoard
        countLabel={`${howItWorks.steps.length} ${howItWorks.steps.length === 1 ? "step" : "steps"}`}
        onCreate={() => {
          const doc = readAboutSections();
          const item = blankStep(doc.howItWorks.steps.length);
          commit({
            ...doc,
            howItWorks: {
              ...doc.howItWorks,
              steps: [...doc.howItWorks.steps, item],
            },
          });
          return item.id;
        }}
        records={howItWorks.steps.map((item) => ({
          id: item.id,
          title: item.title || "Untitled step",
          meta: item.step,
          icon: item.icon,
        }))}
        onDelete={(id) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            howItWorks: {
              ...doc.howItWorks,
              steps: doc.howItWorks.steps.filter((item) => item.id !== id),
            },
          });
        }}
        onMove={(id, direction) => {
          const doc = readAboutSections();
          commit({
            ...doc,
            howItWorks: {
              ...doc.howItWorks,
              steps: shiftById(doc.howItWorks.steps, id, direction),
            },
          });
        }}
        renderForm={(id) => <StepForm id={id} />}
      />
    </div>
  );
}

function StepForm({ id }: { id: string }) {
  const { howItWorks } = useAboutSections();
  const item = howItWorks.steps.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(patch: Partial<AboutStepItem>) {
    const doc = readAboutSections();
    commit({
      ...doc,
      howItWorks: {
        ...doc.howItWorks,
        steps: doc.howItWorks.steps.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      },
    });
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Number"
        value={item.step}
        onChange={(step) => update({ step })}
      />
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) => update({ title })}
      />
      <div className="sm:col-span-2">
        <AreaField
          label="Description"
          value={item.description}
          onChange={(description) => update({ description })}
        />
      </div>
      <div className="sm:col-span-2">
        <IconField value={item.icon} onChange={(icon) => update({ icon })} />
      </div>
    </div>
  );
}

function CtaEditor() {
  const { cta } = useAboutSections();

  function patch(partial: Partial<AboutSections["cta"]>) {
    const doc = readAboutSections();
    commit({ ...doc, cta: { ...doc.cta, ...partial } });
  }

  return (
    <Panel>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            label="Title"
            value={cta.title}
            onChange={(title) => patch({ title })}
          />
        </div>
        <div className="sm:col-span-2">
          <AreaField
            label="Subtitle"
            value={cta.subtitle}
            onChange={(subtitle) => patch({ subtitle })}
          />
        </div>
        <LinkFields
          label="Primary button"
          value={cta.primaryCta}
          onChange={(primaryCta) => patch({ primaryCta })}
        />
        <LinkFields
          label="Secondary button"
          value={cta.secondaryCta}
          onChange={(secondaryCta) => patch({ secondaryCta })}
        />
      </div>
    </Panel>
  );
}

function FeatureForm({
  id,
  scope,
}: {
  id: string;
  scope: "dresses" | "values";
}) {
  const data = useAboutSections();
  const items =
    scope === "dresses" ? data.customDresses.features : data.values.items;
  const item = items.find((entry) => entry.id === id);
  if (!item) return <MissingRecord />;
  function update(patch: Partial<AboutFeatureItem>) {
    const doc = readAboutSections();
    if (scope === "dresses") {
      commit({
        ...doc,
        customDresses: {
          ...doc.customDresses,
          features: doc.customDresses.features.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry,
          ),
        },
      });
      return;
    }
    commit({
      ...doc,
      values: {
        ...doc.values,
        items: doc.values.items.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      },
    });
  }
  return (
    <div className="grid gap-4">
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) => update({ title })}
      />
      <AreaField
        label="Description"
        value={item.description}
        onChange={(description) => update({ description })}
      />
      <IconField value={item.icon} onChange={(icon) => update({ icon })} />
    </div>
  );
}

function ImageForm({
  id,
  scope,
}: {
  id: string;
  scope: "hero" | "story" | "gallery";
}) {
  const data = useAboutSections();
  const images =
    scope === "hero"
      ? data.hero.images
      : scope === "story"
        ? data.story.images
        : data.customDresses.gallery;
  const image = images.find((entry) => entry.id === id);
  if (!image) return <MissingRecord />;
  function update(patch: Partial<AboutImage>) {
    const doc = readAboutSections();
    if (scope === "hero") {
      commit({
        ...doc,
        hero: {
          ...doc.hero,
          images: doc.hero.images.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry,
          ),
        },
      });
      return;
    }
    if (scope === "story") {
      commit({
        ...doc,
        story: {
          ...doc.story,
          images: doc.story.images.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry,
          ),
        },
      });
      return;
    }
    commit({
      ...doc,
      customDresses: {
        ...doc.customDresses,
        gallery: doc.customDresses.gallery.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      },
    });
  }
  return (
    <div className="grid gap-4">
      <ImageField value={image.src} onChange={(src) => update({ src })} />
      <TextField
        label="Description"
        value={image.alt}
        onChange={(alt) => update({ alt })}
      />
    </div>
  );
}

function ImageBoard({
  images,
  onCreate,
  onDelete,
  onMove,
  renderForm,
  queryKey = "image",
  autoOpen = true,
  noun = "image",
}: {
  images: AboutImage[];
  onCreate: () => string;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  renderForm: (id: string) => ReactNode;
  queryKey?: string;
  autoOpen?: boolean;
  noun?: string;
}) {
  return (
    <RecordBoard
      queryKey={queryKey}
      autoOpen={autoOpen}
      formTitle="Edit image"
      countLabel={`${images.length} ${images.length === 1 ? noun : `${noun}s`}`}
      onCreate={onCreate}
      records={images.map((image) => ({
        id: image.id,
        title: image.alt || "Untitled image",
        meta: image.src || "No image yet",
        imageSrc: image.src,
      }))}
      onDelete={onDelete}
      onMove={onMove}
      renderForm={renderForm}
    />
  );
}

function LinkFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AboutLink;
  onChange: (next: AboutLink) => void;
}) {
  return (
    <>
      <TextField
        label={label}
        value={value.label}
        onChange={(next) => onChange({ ...value, label: next })}
      />
      <TextField
        label={`${label} link`}
        value={value.href}
        onChange={(href) => onChange({ ...value, href })}
      />
    </>
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
  records: {
    id: string;
    title: string;
    meta: string;
    imageSrc?: string;
    icon?: string;
  }[];
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
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!autoOpen || opened.current || selected || !firstId) return;
    opened.current = true;
    const next = new URLSearchParams(window.location.search);
    next.set(queryKey, firstId);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [autoOpen, firstId, pathname, queryKey, router, selected]);

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
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            Nothing here yet.
          </p>
        ) : (
          <ul>
            {records.map((record) => {
              const active = selected === record.id;
              return (
                <li
                  key={record.id}
                  className="border-t border-neutral-100 first:border-t-0"
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5",
                      active && "bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => open(record.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <RecordThumb
                        imageSrc={record.imageSrc}
                        icon={record.icon}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">
                          {record.title}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {record.meta}
                        </span>
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
                          <MaterialIcon
                            name="arrow_upward"
                            className="text-[18px]"
                          />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={
                            records[records.length - 1]?.id === record.id
                          }
                          onClick={() => onMove(record.id, 1)}
                          className="grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <MaterialIcon
                            name="arrow_downward"
                            className="text-[18px]"
                          />
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
        <h2 className="mb-4 text-sm font-semibold text-neutral-950">
          {formTitle}
        </h2>
        {selected ? (
          renderForm(selected)
        ) : (
          <p className="py-8 text-center text-sm text-neutral-500">
            Select a record, or add one.
          </p>
        )}
      </section>
    </div>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      {title ? (
        <h2 className="mb-4 text-sm font-semibold text-neutral-950">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={adminFieldClass}
      />
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
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
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function IconField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const icons = ICON_OPTIONS.includes(value as (typeof ICON_OPTIONS)[number])
    ? ICON_OPTIONS
    : [value, ...ICON_OPTIONS];
  return (
    <div>
      <FieldLabel>Icon</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={cn(
              "grid size-10 place-items-center rounded-xl ring-1",
              value === icon
                ? "bg-primary/10 text-primary ring-primary/30"
                : "bg-white text-neutral-600 ring-neutral-200",
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
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="44px"
          className="object-cover"
        />
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
  return (
    <p className="text-sm text-neutral-500">This record is no longer here.</p>
  );
}

function shiftById<T extends { id: string }>(
  items: T[],
  id: string,
  direction: -1 | 1,
) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function AboutSectionFallback() {
  return (
    <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
  );
}
