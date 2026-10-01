"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankSustainText,
  readSustainabilitySections,
  saveSustainabilitySections,
  type SustainMedia,
} from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import {
  AddButton,
  DrawerOverlay,
  ImagePanel,
  MissingLine,
  RecordList,
  replaceSearch,
  SavedLine,
  SustainHeader,
  TextPanel,
  useFocusWhenClosed,
  useSustainNav,
} from "./sustain-shared";

export function SustainabilityDurabilityEditor() {
  const { durability } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const selected = params.get("edit");
  const photo = params.get("photo");
  const creating = selected === "new";
  const opened =
    selected && selected !== "new"
      ? (durability.bullets.find((item) => item.id === selected) ?? null)
      : null;
  const photoOpen = photo === "cover";
  const bulletOpen = creating || Boolean(opened);
  const drawerOpen = bulletOpen || photoOpen;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusRef = useFocusWhenClosed(drawerOpen);

  function setKey(key: "edit" | "photo", id: string | null) {
    replaceSearch(router, pathname, (next) => {
      if (id) next.set(key, id);
      else next.delete(key);
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
      durability: {
        ...doc.durability,
        title: next.title ?? "",
        body: next.body ?? "",
      },
    });
  }

  function saveItem(text: string, isActive = true) {
    const doc = readSustainabilitySections();
    if (creating) {
      const item = { ...blankSustainText(), text, isActive };
      saveSustainabilitySections({
        ...doc,
        durability: {
          ...doc.durability,
          bullets: [...doc.durability.bullets, item],
        },
      });
      setSavedId(item.id);
      focusRef.current = `sustain-durable-${item.id}`;
    } else if (selected) {
      saveSustainabilitySections({
        ...doc,
        durability: {
          ...doc.durability,
          bullets: doc.durability.bullets.map((item) =>
            item.id === selected ? { ...item, text, isActive } : item,
          ),
        },
      });
      setSavedId(selected);
      focusRef.current = `sustain-durable-${selected}`;
    }
    flash("Saved");
    setKey("edit", null);
  }

  function saveImage(draft: SustainMedia) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      durability: { ...doc.durability, image: draft },
    });
    focusRef.current = "sustain-durable-photo";
    flash("Saved");
    setKey("photo", null);
  }

  function remove(id: string) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({
      ...doc,
      durability: {
        ...doc.durability,
        bullets: doc.durability.bullets.filter((item) => item.id !== id),
      },
    });
    if (selected === id) setKey("edit", null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readSustainabilitySections();
    const index = doc.durability.bullets.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.durability.bullets.length)
      return;
    const next = [...doc.durability.bullets];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveSustainabilitySections({
      ...doc,
      durability: { ...doc.durability, bullets: next },
    });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readSustainabilitySections();
    const next = [...doc.durability.bullets];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveSustainabilitySections({
      ...doc,
      durability: { ...doc.durability, bullets: next },
    });
    setDragId(null);
    setOverId(null);
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="durability"
        title="Built to last"
        description="Less waste, products that last."
        extra={
          <AddButton onClick={() => setKey("edit", "new")}>
            Add bullet
          </AddButton>
        }
      />
      <SavedLine notice={notice} open={drawerOpen} />
      <MissingLine
        show={Boolean(selected && selected !== "new" && !opened)}
        onClose={() => setKey("edit", null)}
      />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90">
        <div className="px-4 pt-4 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown on the sustainability page. Bullets stay in this order.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid items-stretch overflow-hidden rounded-2xl bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] xl:grid-cols-2">
            <div className="p-4 sm:p-6">
              <p className="text-xl font-semibold text-white">
                {durability.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {durability.body}
              </p>
              <ul className="mt-5 space-y-2.5">
                {durability.bullets.map((bullet) => (
                  <li key={bullet.id}>
                    <button
                      type="button"
                      onClick={() => setKey("edit", bullet.id)}
                      className="flex items-start gap-2.5 text-left text-sm text-white/85"
                    >
                      <MaterialIcon
                        name="check_circle"
                        className="mt-0.5 shrink-0 text-[18px] text-primary"
                      />
                      <span>{bullet.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              aria-label={durability.image.alt || "Photo"}
              onClick={() => setKey("photo", "cover")}
              className="relative min-h-48"
            >
              {durability.image.src ? (
                <Image
                  src={durability.image.src}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-sm text-white/70">
                  Photo
                </span>
              )}
            </button>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{ title: durability.title, body: durability.body }}
          fields={[
            { name: "title", label: "Title", wide: true },
            {
              name: "body",
              label: "Body",
              multiline: true,
              rows: 4,
              wide: true,
            },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>
      <RecordList
        headingId="sustain-durable-list"
        title={
          durability.bullets.length === 1
            ? "1 bullet"
            : `${durability.bullets.length} bullets`
        }
        emptyTitle="No bullets yet"
        emptyBody="Add the points shown beside the photo."
        emptyAction="Add bullet"
        onEmpty={() => setKey("edit", "new")}
        items={durability.bullets.map((item) => ({
          id: item.id,
          buttonId: `sustain-durable-${item.id}`,
          title: item.text || "Empty bullet",
          active: item.isActive !== false,
          meta: "Bullet",
          reorder: item.text || "bullet",
        }))}
        selected={selected}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("edit", id)}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={dropOn}
        onMove={move}
        onAskRemove={setConfirmId}
        onRemove={remove}
        removeLabel="Remove bullet"
      />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Photo</h2>
        </div>
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <button
            id="sustain-durable-photo"
            type="button"
            onClick={() => setKey("photo", "cover")}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="relative size-12 overflow-hidden rounded-xl bg-neutral-100">
              {durability.image.src ? (
                <Image
                  src={durability.image.src}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-950">
                {durability.image.alt || "No description"}
              </span>
              <span className="block text-xs text-neutral-500">
                Cover photo
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setKey("photo", "cover")}
            className="text-sm font-medium text-neutral-600"
          >
            Edit
          </button>
        </div>
      </section>
      {drawerOpen ? (
        <DrawerOverlay titleId="sustain-durable-drawer">
          {bulletOpen ? (
            <TextPanel
              key={selected}
              creating={creating}
              noun="Bullet"
              titleId="sustain-durable-drawer"
              initial={opened?.text ?? ""}
              active={opened?.isActive}
              notice={notice}
              onClose={() => setKey("edit", null)}
              onSave={saveItem}
            />
          ) : null}
          {photoOpen ? (
            <ImagePanel
              creating={false}
              titleId={bulletOpen ? undefined : "sustain-durable-drawer"}
              initial={durability.image}
              notice={notice}
              onClose={() => setKey("photo", null)}
              onSave={saveImage}
            />
          ) : null}
        </DrawerOverlay>
      ) : null}
    </div>
  );
}
