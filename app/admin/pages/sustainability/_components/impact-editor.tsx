"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { blankSustainStat, readSustainabilitySections, saveSustainabilitySections, type SustainStat } from "@/lib/mart-mock/sustainability-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import { AddButton, DrawerOverlay, iconLabel, MissingLine, RecordList, replaceSearch, SavedLine, StatPanel, SustainHeader, useFocusWhenClosed, useSustainNav } from "./sustain-shared";

export function SustainabilityImpactEditor() {
  const { impact } = useSustainabilitySections();
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const selected = params.get("edit");
  const creating = selected === "new";
  const opened = selected && selected !== "new" ? (impact.stats.find((item) => item.id === selected) ?? null) : null;
  const drawerOpen = creating || Boolean(opened);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusRef = useFocusWhenClosed(drawerOpen);

  function setEdit(id: string | null) {
    replaceSearch(router, pathname, (next) => {
      if (id) next.set("edit", id);
      else next.delete("edit");
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
      impact: { ...doc.impact, kicker: next.kicker ?? "", title: next.title ?? "", subtitle: next.subtitle ?? "" },
    });
  }

  function saveItem(draft: Pick<SustainStat, "icon" | "value" | "label">) {
    const doc = readSustainabilitySections();
    if (creating) {
      const item = { ...blankSustainStat(), ...draft };
      saveSustainabilitySections({ ...doc, impact: { ...doc.impact, stats: [...doc.impact.stats, item] } });
      setSavedId(item.id);
      focusRef.current = `sustain-impact-${item.id}`;
    } else if (selected) {
      saveSustainabilitySections({
        ...doc,
        impact: { ...doc.impact, stats: doc.impact.stats.map((item) => (item.id === selected ? { ...item, ...draft } : item)) },
      });
      setSavedId(selected);
      focusRef.current = `sustain-impact-${selected}`;
    }
    flash("Saved");
    setEdit(null);
  }

  function remove(id: string) {
    const doc = readSustainabilitySections();
    saveSustainabilitySections({ ...doc, impact: { ...doc.impact, stats: doc.impact.stats.filter((item) => item.id !== id) } });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readSustainabilitySections();
    const index = doc.impact.stats.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.impact.stats.length) return;
    const next = [...doc.impact.stats];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveSustainabilitySections({ ...doc, impact: { ...doc.impact, stats: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readSustainabilitySections();
    const next = [...doc.impact.stats];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveSustainabilitySections({ ...doc, impact: { ...doc.impact, stats: next } });
    setDragId(null);
    setOverId(null);
  }

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader sectionId="impact" title="Habits" description="COD, returns, checks, and packing stats." extra={<AddButton onClick={() => setEdit("new")}>Add stat</AddButton>} />
      <SavedLine notice={notice} open={drawerOpen} />
      <MissingLine show={Boolean(selected && selected !== "new" && !opened)} onClose={() => setEdit(null)} />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90">
        <div className="px-4 pt-4 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Storefront preview</h2>
          <p className="mt-1 text-sm text-neutral-500">Shown under the hero. Stats stay in this order.</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl bg-[#f5f6f8] p-4 sm:p-5">
            <div className="mx-auto mb-4 max-w-2xl text-center">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">{impact.kicker}</p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">{impact.title}</p>
              <p className="mt-2 text-sm text-neutral-600">{impact.subtitle}</p>
            </div>
            <ul className="grid grid-cols-2 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white xl:grid-cols-4">
              {impact.stats.map((stat) => (
                <li key={stat.id}>
                  <button type="button" onClick={() => setEdit(stat.id)} className="flex w-full flex-col items-center gap-1 px-3 py-3 text-center">
                    <MaterialIcon name={stat.icon || "notes"} className="text-[18px] text-primary" />
                    <span className="text-sm font-semibold text-neutral-950">{stat.value}</span>
                    <span className="text-[11px] text-neutral-600">{stat.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{ kicker: impact.kicker, title: impact.title, subtitle: impact.subtitle }}
          fields={[
            { name: "kicker", label: "Eyebrow" },
            { name: "title", label: "Title" },
            { name: "subtitle", label: "Subtitle", multiline: true, rows: 3, wide: true },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>
      <RecordList
        headingId="sustain-impact-list"
        title={impact.stats.length === 1 ? "1 stat" : `${impact.stats.length} stats`}
        emptyTitle="No stats yet"
        emptyBody="Add the habits shown under the hero."
        emptyAction="Add stat"
        onEmpty={() => setEdit("new")}
        items={impact.stats.map((item) => ({
          id: item.id,
          buttonId: `sustain-impact-${item.id}`,
          title: item.label || "Empty stat",
          meta: `${item.value || "No value"} · ${iconLabel(item.icon)}`,
          reorder: item.label || "stat",
          icon: item.icon,
        }))}
        selected={selected}
        savedId={savedId}
        confirmId={confirmId}
        dragId={dragId}
        overId={overId}
        onOpen={setEdit}
        onDrag={setDragId}
        onOver={setOverId}
        onDrop={dropOn}
        onMove={move}
        onAskRemove={setConfirmId}
        onRemove={remove}
        removeLabel="Remove stat"
      />
      {drawerOpen ? (
        <DrawerOverlay titleId="sustain-impact-drawer" onClose={() => setEdit(null)}>
          <StatPanel
            key={selected}
            creating={creating}
            titleId="sustain-impact-drawer"
            initial={opened ? { icon: opened.icon, value: opened.value, label: opened.label } : { icon: "verified", value: "", label: "" }}
            notice={notice}
            onClose={() => setEdit(null)}
            onSave={saveItem}
          />
        </DrawerOverlay>
      ) : null}
    </div>
  );
}
