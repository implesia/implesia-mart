"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankSustainBadge,
  blankSustainText,
  readSustainabilitySections,
  saveSustainabilitySections,
  type SustainBadge,
  type SustainMedia,
} from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import { AddButton, BadgePanel, DrawerOverlay, iconLabel, ImagePanel, MissingLine, RecordList, replaceSearch, SavedLine, SustainHeader, TextPanel, useFocusWhenClosed, useSustainNav } from "./sustain-shared";

export function SustainabilityQualityEditor() {
  const { quality } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const stepId = params.get("step");
  const badgeId = params.get("badge");
  const photo = params.get("photo");
  const openedStep = stepId && stepId !== "new" ? (quality.steps.find((item) => item.id === stepId) ?? null) : null;
  const openedBadge = badgeId && badgeId !== "new" ? (quality.badges.find((item) => item.id === badgeId) ?? null) : null;
  const photoOpen = photo === "cover";
  const drawerOpen = stepId === "new" || Boolean(openedStep) || badgeId === "new" || Boolean(openedBadge) || photoOpen;
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusRef = useFocusWhenClosed(drawerOpen);

  function setKey(key: "step" | "badge" | "photo", id: string | null) {
    replaceSearch(router, pathname, (next) => {
      if (id) next.set(key, id);
      else next.delete(key);
    });
  }

  function closeAll() {
    replaceSearch(router, pathname, (next) => {
      next.delete("step");
      next.delete("badge");
      next.delete("photo");
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
    saveSustainabilitySections({ ...doc, quality: { ...doc.quality, title: next.title ?? "", body: next.body ?? "" } });
  }

  function saveStep(text: string) {
    const doc = readSustainabilitySections();
    if (stepId === "new") {
      const item = { ...blankSustainText(), text };
      saveSustainabilitySections({ ...doc, quality: { ...doc.quality, steps: [...doc.quality.steps, item] } });
      setSavedId(item.id);
      focusRef.current = `sustain-quality-step-${item.id}`;
    } else if (stepId) {
      saveSustainabilitySections({
        ...doc,
        quality: { ...doc.quality, steps: doc.quality.steps.map((item) => (item.id === stepId ? { ...item, text } : item)) },
      });
      setSavedId(stepId);
      focusRef.current = `sustain-quality-step-${stepId}`;
    }
    flash("Saved");
    setKey("step", null);
  }

  function saveBadge(draft: Pick<SustainBadge, "icon" | "label">) {
    const doc = readSustainabilitySections();
    if (badgeId === "new") {
      const item = { ...blankSustainBadge(), ...draft };
      saveSustainabilitySections({ ...doc, quality: { ...doc.quality, badges: [...doc.quality.badges, item] } });
      setSavedId(item.id);
      focusRef.current = `sustain-quality-badge-${item.id}`;
    } else if (badgeId) {
      saveSustainabilitySections({
        ...doc,
        quality: { ...doc.quality, badges: doc.quality.badges.map((item) => (item.id === badgeId ? { ...item, ...draft } : item)) },
      });
      setSavedId(badgeId);
      focusRef.current = `sustain-quality-badge-${badgeId}`;
    }
    flash("Saved");
    setKey("badge", null);
  }

  function saveImage(draft: SustainMedia) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({ ...doc, quality: { ...doc.quality, image: draft } });
    focusRef.current = "sustain-quality-photo";
    flash("Saved");
    setKey("photo", null);
  }

  function removeStep(id: string) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({ ...doc, quality: { ...doc.quality, steps: doc.quality.steps.filter((item) => item.id !== id) } });
    if (stepId === id) setKey("step", null);
    setConfirmId(null);
    flash("Removed");
  }

  function removeBadge(id: string) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({ ...doc, quality: { ...doc.quality, badges: doc.quality.badges.filter((item) => item.id !== id) } });
    if (badgeId === id) setKey("badge", null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(list: "steps" | "badges", id: string, direction: -1 | 1) {
    const doc = readSustainabilitySections();
    const items = [...doc.quality[list]];
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const [item] = items.splice(index, 1);
    if (!item) return;
    items.splice(target, 0, item);
    saveSustainabilitySections({ ...doc, quality: { ...doc.quality, [list]: items } });
  }

  function drop(list: "steps" | "badges", targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readSustainabilitySections();
    const items = [...doc.quality[list]];
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = items.splice(from, 1);
    if (!item) return;
    items.splice(to, 0, item);
    saveSustainabilitySections({ ...doc, quality: { ...doc.quality, [list]: items } });
    setDragId(null);
    setOverId(null);
  }

  const stepOpen = stepId === "new" || Boolean(openedStep);
  const badgeOpen = badgeId === "new" || Boolean(openedBadge);

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="quality"
        title="Quality"
        description="Check process and badges."
        extra={
          <>
            <AddButton onClick={() => setKey("step", "new")}>Add step</AddButton>
            <AddButton secondary onClick={() => setKey("badge", "new")}>
              Add badge
            </AddButton>
          </>
        }
      />
      <SavedLine notice={notice} open={drawerOpen} />
      <MissingLine show={Boolean(stepId && stepId !== "new" && !openedStep)} onClose={() => setKey("step", null)} />
      <MissingLine show={Boolean(badgeId && badgeId !== "new" && !openedBadge)} onClose={() => setKey("badge", null)} />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90">
        <div className="px-4 pt-4 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Storefront preview</h2>
          <p className="mt-1 text-sm text-neutral-500">Shown on the sustainability page. Steps and badges stay in this order.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid items-start gap-6 rounded-2xl bg-[#f5f6f8] p-4 xl:grid-cols-2 sm:p-5">
            <button type="button" aria-label={quality.image.alt || "Photo"} onClick={() => setKey("photo", "cover")} className="relative aspect-4/5 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
              {quality.image.src ? <Image src={quality.image.src} alt="" fill sizes="320px" className="object-cover" /> : <span className="grid size-full place-items-center text-sm text-neutral-500">Photo</span>}
            </button>
            <div>
              <p className="text-xl font-semibold text-neutral-950">{quality.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{quality.body}</p>
              <ol className="mt-5 space-y-3">
                {quality.steps.map((step, index) => (
                  <li key={step.id}>
                    <button type="button" onClick={() => setKey("step", step.id)} className="flex items-start gap-3 text-left">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                      <span className="text-sm text-neutral-700">{step.text}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                {quality.badges.map((badge) => (
                  <button key={badge.id} type="button" onClick={() => setKey("badge", badge.id)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                    <MaterialIcon name={badge.icon || "notes"} className="text-[16px] text-primary" />
                    {badge.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{ title: quality.title, body: quality.body }}
          fields={[
            { name: "title", label: "Title", wide: true },
            { name: "body", label: "Body", multiline: true, rows: 4, wide: true },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>
      <RecordList
        headingId="sustain-quality-steps"
        title={quality.steps.length === 1 ? "1 step" : `${quality.steps.length} steps`}
        emptyTitle="No steps yet"
        emptyBody="Add the check steps shown beside the photo."
        emptyAction="Add step"
        onEmpty={() => setKey("step", "new")}
        items={quality.steps.map((item, index) => ({
          id: item.id,
          buttonId: `sustain-quality-step-${item.id}`,
          title: item.text || "Empty step",
          meta: `Step ${index + 1}`,
          reorder: item.text || "step",
        }))}
        selected={stepId}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("step", id)}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={(id) => drop("steps", id)}
        onMove={(id, direction) => move("steps", id, direction)}
        onAskRemove={setConfirmId}
        onRemove={removeStep}
        removeLabel="Remove step"
      />
      <RecordList
        headingId="sustain-quality-badges"
        title={quality.badges.length === 1 ? "1 badge" : `${quality.badges.length} badges`}
        emptyTitle="No badges yet"
        emptyBody="Add the badges shown under the steps."
        emptyAction="Add badge"
        onEmpty={() => setKey("badge", "new")}
        items={quality.badges.map((item) => ({
          id: item.id,
          buttonId: `sustain-quality-badge-${item.id}`,
          title: item.label || "Empty badge",
          meta: iconLabel(item.icon),
          reorder: item.label || "badge",
          icon: item.icon,
        }))}
        selected={badgeId}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={(id) => setKey("badge", id)}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={(id) => drop("badges", id)}
        onMove={(id, direction) => move("badges", id, direction)}
        onAskRemove={setConfirmId}
        onRemove={removeBadge}
        removeLabel="Remove badge"
      />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Photo</h2>
        </div>
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <button id="sustain-quality-photo" type="button" onClick={() => setKey("photo", "cover")} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="relative size-12 overflow-hidden rounded-xl bg-neutral-100">
              {quality.image.src ? <Image src={quality.image.src} alt="" fill sizes="48px" className="object-cover" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-950">{quality.image.alt || "No description"}</span>
              <span className="block text-xs text-neutral-500">Cover photo</span>
            </span>
          </button>
          <button type="button" onClick={() => setKey("photo", "cover")} className="text-sm font-medium text-neutral-600">
            Edit
          </button>
        </div>
      </section>
      {drawerOpen ? (
        <DrawerOverlay titleId="sustain-quality-drawer" onClose={closeAll}>
          {stepOpen ? (
            <TextPanel
              key={stepId}
              creating={stepId === "new"}
              noun="Step"
              titleId="sustain-quality-drawer"
              initial={openedStep?.text ?? ""}
              notice={notice}
              onClose={() => setKey("step", null)}
              onSave={saveStep}
            />
          ) : null}
          {badgeOpen ? (
            <BadgePanel
              key={badgeId}
              creating={badgeId === "new"}
              titleId={stepOpen ? undefined : "sustain-quality-drawer"}
              initial={openedBadge ? { icon: openedBadge.icon, label: openedBadge.label } : { icon: "check_circle", label: "" }}
              notice={notice}
              onClose={() => setKey("badge", null)}
              onSave={saveBadge}
            />
          ) : null}
          {photoOpen ? (
            <ImagePanel
              creating={false}
              titleId={stepOpen || badgeOpen ? undefined : "sustain-quality-drawer"}
              initial={quality.image}
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
