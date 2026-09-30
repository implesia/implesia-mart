"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { blankSustainImage, readSustainabilitySections, saveSustainabilitySections, type SustainImage } from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import { AddButton, DrawerOverlay, ImagePanel, MissingLine, RecordList, replaceSearch, SavedLine, SustainHeader, useFocusWhenClosed, useSustainNav } from "./sustain-shared";

export function SustainabilityOriginEditor() {
  const { origin } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const selected = params.get("image");
  const creating = selected === "new";
  const opened = selected && selected !== "new" ? (origin.images.find((item) => item.id === selected) ?? null) : null;
  const drawerOpen = creating || Boolean(opened);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusRef = useFocusWhenClosed(drawerOpen);

  function setImage(id: string | null) {
    replaceSearch(router, pathname, (next) => {
      if (id) next.set("image", id);
      else next.delete("image");
    });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
  }

  function saveCopy(next: Record<string, string>) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      origin: { ...doc.origin, eyebrow: next.eyebrow ?? "", title: next.title ?? "", body: next.body ?? "", quote: next.quote ?? "" },
    });
  }

  function saveItem(draft: Pick<SustainImage, "src" | "alt">) {
    const doc = readSustainabilitySections();
    if (creating) {
      const item = { ...blankSustainImage(), ...draft };
      saveSustainabilitySections({ ...doc, origin: { ...doc.origin, images: [...doc.origin.images, item] } });
      setSavedId(item.id);
      focusRef.current = `sustain-origin-${item.id}`;
    } else if (selected) {
      saveSustainabilitySections({
        ...doc,
        origin: { ...doc.origin, images: doc.origin.images.map((item) => (item.id === selected ? { ...item, ...draft } : item)) },
      });
      setSavedId(selected);
      focusRef.current = `sustain-origin-${selected}`;
    }
    flash("Saved");
    setImage(null);
  }

  function remove(id: string) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({ ...doc, origin: { ...doc.origin, images: doc.origin.images.filter((item) => item.id !== id) } });
    if (selected === id) setImage(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readSustainabilitySections();
    const index = doc.origin.images.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.origin.images.length) return;
    const next = [...doc.origin.images];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveSustainabilitySections({ ...doc, origin: { ...doc.origin, images: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readSustainabilitySections();
    const next = [...doc.origin.images];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveSustainabilitySections({ ...doc, origin: { ...doc.origin, images: next } });
    setDragId(null);
    setOverId(null);
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader sectionId="origin" title="Point of view" description="Why quality is a responsibility." extra={<AddButton onClick={() => setImage("new")}>Add photo</AddButton>} />
      <SavedLine notice={notice} open={drawerOpen} />
      <MissingLine show={Boolean(selected && selected !== "new" && !opened)} onClose={() => setImage(null)} />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90">
        <div className="px-4 pt-4 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Storefront preview</h2>
          <p className="mt-1 text-sm text-neutral-500">Shown on the sustainability page. Photos stay in this order.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid items-start gap-6 rounded-2xl bg-[#f5f6f8] p-4 xl:grid-cols-2 sm:p-5">
            <div>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">{origin.eyebrow}</p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">{origin.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{origin.body}</p>
              {origin.quote ? <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-700 italic ring-1 ring-neutral-200">{origin.quote}</p> : null}
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {origin.images.map((image) => (
                <li key={image.id}>
                  <button type="button" aria-label={image.alt || "Photo"} onClick={() => setImage(image.id)} className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
                    {image.src ? <Image src={image.src} alt="" fill sizes="180px" className="object-cover" /> : <span className="grid size-full place-items-center text-xs text-neutral-500">Photo</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{ eyebrow: origin.eyebrow, title: origin.title, body: origin.body, quote: origin.quote }}
          fields={[
            { name: "eyebrow", label: "Eyebrow" },
            { name: "title", label: "Title", wide: true },
            { name: "body", label: "Body", multiline: true, rows: 5, wide: true },
            { name: "quote", label: "Quote", multiline: true, rows: 3, wide: true },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>
      <RecordList
        headingId="sustain-origin-list"
        title={origin.images.length === 1 ? "1 photo" : `${origin.images.length} photos`}
        emptyTitle="No photos yet"
        emptyBody="Add the photos shown beside the point of view."
        emptyAction="Add photo"
        onEmpty={() => setImage("new")}
        items={origin.images.map((image) => ({
          id: image.id,
          buttonId: `sustain-origin-${image.id}`,
          title: image.alt || "No description",
          meta: "Photo",
          reorder: image.alt || "photo",
          imageSrc: image.src,
        }))}
        selected={selected}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={setImage}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={dropOn}
        onMove={move}
        onAskRemove={setConfirmId}
        onRemove={remove}
        removeLabel="Remove photo"
      />
      {drawerOpen ? (
        <DrawerOverlay titleId="sustain-origin-drawer" onClose={() => setImage(null)}>
          <ImagePanel
            key={selected}
            creating={creating}
            titleId="sustain-origin-drawer"
            initial={opened ? { src: opened.src, alt: opened.alt } : { src: "", alt: "" }}
            notice={notice}
            onClose={() => setImage(null)}
            onSave={saveItem}
          />
        </DrawerOverlay>
      ) : null}
    </div>
  );
}
