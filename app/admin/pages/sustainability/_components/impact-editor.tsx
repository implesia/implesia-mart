"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  createSustainabilityImpactStat,
  deleteSustainabilityImpactStat,
  listSustainabilityImpact,
  reorderSustainabilityImpact,
  updateSustainabilityImpactCopy,
  updateSustainabilityImpactStat,
  type SustainabilityImpact,
  type SustainabilityImpactDraft,
} from "@/lib/mart-api/sustainability-impact";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import {
  AddButton,
  DrawerOverlay,
  iconLabel,
  MissingLine,
  RecordList,
  replaceSearch,
  SavedLine,
  StatPanel,
  SustainHeader,
  useFocusWhenClosed,
  useSustainNav,
} from "./sustain-shared";

export function SustainabilityImpactEditor() {
  const [impact, setImpact] = useState<SustainabilityImpact | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const selected = params.get("edit");
  const creating = selected === "new";
  const opened =
    selected && selected !== "new"
      ? (impact?.items.find((item) => item.id === selected) ?? null)
      : null;
  const drawerOpen = creating || Boolean(opened);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusRef = useFocusWhenClosed(drawerOpen);

  useEffect(() => {
    let active = true;
    listSustainabilityImpact()
      .then((next) => {
        if (active) setImpact(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the habits.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

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

  async function saveCopy(next: Record<string, string>) {
    const saved = await updateSustainabilityImpactCopy({
      kicker: next.kicker ?? "",
      title: next.title ?? "",
      subtitle: next.subtitle ?? "",
    });
    setImpact(saved);
  }

  async function saveItem(draft: SustainabilityImpactDraft) {
    setActionError("");
    if (creating) {
      const item = await createSustainabilityImpactStat(draft);
      setImpact((current) =>
        current ? { ...current, items: [...current.items, item] } : current,
      );
      setSavedId(item.id);
      focusRef.current = `sustain-impact-${item.id}`;
    } else if (selected) {
      const item = await updateSustainabilityImpactStat(selected, draft);
      setImpact((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.id === item.id ? item : entry,
              ),
            }
          : current,
      );
      setSavedId(selected);
      focusRef.current = `sustain-impact-${selected}`;
    }
    flash("Saved");
    setEdit(null);
  }

  async function remove(id: string) {
    setActionError("");
    try {
      await deleteSustainabilityImpactStat(id);
      setImpact((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== id),
            }
          : current,
      );
      if (selected === id) setEdit(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setConfirmId(null);
      setActionError(
        error instanceof Error ? error.message : "Could not remove the stat.",
      );
    }
  }

  async function persistOrder(ids: string[]) {
    const saved = await reorderSustainabilityImpact(ids);
    setImpact(saved);
  }

  async function move(id: string, direction: -1 | 1) {
    if (!impact) return;
    const index = impact.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= impact.items.length) return;
    const next = [...impact.items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setActionError("");
    try {
      await persistOrder(next.map((entry) => entry.id));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not reorder the stats.",
      );
    }
  }

  async function dropOn(targetId: string) {
    if (!dragId || dragId === targetId || !impact) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...impact.items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setActionError("");
    try {
      await persistOrder(next.map((entry) => entry.id));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not reorder the stats.",
      );
    }
  }

  if (!impact) {
    return (
      <div className="min-w-0 space-y-4">
        <SustainHeader
          sectionId="impact"
          title="Habits"
          description="COD, returns, checks, and packing stats."
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the habits…"}
        </p>
      </div>
    );
  }

  const visible = impact.items.filter((stat) => stat.isActive !== false);

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="impact"
        title="Habits"
        description="COD, returns, checks, and packing stats."
        extra={<AddButton onClick={() => setEdit("new")}>Add stat</AddButton>}
      />
      <SavedLine notice={notice} open={drawerOpen} />
      {actionError ? (
        <p className="text-sm text-red-700">{actionError}</p>
      ) : null}
      <MissingLine
        show={Boolean(selected && selected !== "new" && !opened)}
        onClose={() => setEdit(null)}
      />
      <section className="overflow-hidden rounded-2xl bg-admin-canvas ring-1 ring-neutral-200/90">
        <div className="px-4 pt-4 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Shown under the hero. Hidden stats stay off this preview.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl bg-[#f5f6f8] p-4 sm:p-5">
            <div className="mx-auto mb-4 max-w-2xl text-center">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                {impact.kicker}
              </p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {impact.title}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{impact.subtitle}</p>
            </div>
            <ul className="grid grid-cols-2 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white xl:grid-cols-4">
              {visible.map((stat) => (
                <li key={stat.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(stat.id)}
                    className="flex w-full flex-col items-center gap-1 px-3 py-3 text-center"
                  >
                    <MaterialIcon
                      name={stat.icon || "notes"}
                      className="text-[18px] text-primary"
                    />
                    <span className="text-sm font-semibold text-neutral-950">
                      {stat.value}
                    </span>
                    <span className="text-[11px] text-neutral-600">
                      {stat.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
        <SectionCopyForm
          values={{
            kicker: impact.kicker,
            title: impact.title,
            subtitle: impact.subtitle,
          }}
          fields={[
            { name: "kicker", label: "Eyebrow" },
            { name: "title", label: "Title" },
            {
              name: "subtitle",
              label: "Subtitle",
              multiline: true,
              rows: 3,
              wide: true,
            },
          ]}
          saveLabel="Save heading"
          onSave={saveCopy}
        />
      </section>
      <RecordList
        headingId="sustain-impact-list"
        title={
          impact.items.length === 1 ? "1 stat" : `${impact.items.length} stats`
        }
        emptyTitle="No stats yet"
        emptyBody="Add the habits shown under the hero."
        emptyAction="Add stat"
        onEmpty={() => setEdit("new")}
        items={impact.items.map((item) => ({
          id: item.id,
          buttonId: `sustain-impact-${item.id}`,
          title: item.label || "Empty stat",
          active: item.isActive !== false,
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
        <DrawerOverlay titleId="sustain-impact-drawer">
          <StatPanel
            key={selected}
            creating={creating}
            titleId="sustain-impact-drawer"
            initial={
              opened
                ? {
                    icon: opened.icon,
                    value: opened.value,
                    label: opened.label,
                    isActive: opened.isActive,
                  }
                : { icon: "verified", value: "", label: "", isActive: true }
            }
            notice={notice}
            onClose={() => setEdit(null)}
            onSave={saveItem}
          />
        </DrawerOverlay>
      ) : null}
    </div>
  );
}
