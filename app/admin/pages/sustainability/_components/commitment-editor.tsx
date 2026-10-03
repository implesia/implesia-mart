"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  createSustainabilityCommitmentCard,
  deleteSustainabilityCommitmentCard,
  listSustainabilityCommitment,
  reorderSustainabilityCommitment,
  updateSustainabilityCommitmentCard,
  updateSustainabilityCommitmentCopy,
  type SustainabilityCommitment,
  type SustainabilityCommitmentDraft,
} from "@/lib/mart-api/sustainability-commitment";

import { SectionCopyForm } from "../../../home/_components/section-copy-form";
import {
  AddButton,
  CardPanel,
  DrawerOverlay,
  iconLabel,
  MissingLine,
  RecordList,
  replaceSearch,
  SavedLine,
  SustainHeader,
  useFocusWhenClosed,
  useSustainNav,
} from "./sustain-shared";

export function SustainabilityCommitmentEditor() {
  const [commitment, setCommitment] = useState<SustainabilityCommitment | null>(
    null,
  );
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useSustainNav();
  const selected = params.get("edit");
  const creating = selected === "new";
  const opened =
    selected && selected !== "new"
      ? (commitment?.items.find((item) => item.id === selected) ?? null)
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
    listSustainabilityCommitment()
      .then((next) => {
        if (active) setCommitment(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the commitment.",
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
    const saved = await updateSustainabilityCommitmentCopy({
      kicker: next.kicker ?? "",
      title: next.title ?? "",
      subtitle: next.subtitle ?? "",
    });
    setCommitment(saved);
  }

  async function saveItem(draft: SustainabilityCommitmentDraft) {
    setActionError("");
    if (creating) {
      const item = await createSustainabilityCommitmentCard(draft);
      setCommitment((current) =>
        current ? { ...current, items: [...current.items, item] } : current,
      );
      setSavedId(item.id);
      focusRef.current = `sustain-commit-${item.id}`;
    } else if (selected) {
      const item = await updateSustainabilityCommitmentCard(selected, draft);
      setCommitment((current) =>
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
      focusRef.current = `sustain-commit-${selected}`;
    }
    flash("Saved");
    setEdit(null);
  }

  async function remove(id: string) {
    setActionError("");
    try {
      await deleteSustainabilityCommitmentCard(id);
      setCommitment((current) =>
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
        error instanceof Error ? error.message : "Could not remove the card.",
      );
    }
  }

  async function persistOrder(ids: string[]) {
    const saved = await reorderSustainabilityCommitment(ids);
    setCommitment(saved);
  }

  async function move(id: string, direction: -1 | 1) {
    if (!commitment) return;
    const index = commitment.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= commitment.items.length) return;
    const next = [...commitment.items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setActionError("");
    try {
      await persistOrder(next.map((entry) => entry.id));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not reorder the cards.",
      );
    }
  }

  async function dropOn(targetId: string) {
    if (!dragId || dragId === targetId || !commitment) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...commitment.items];
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
        error instanceof Error ? error.message : "Could not reorder the cards.",
      );
    }
  }

  if (!commitment) {
    return (
      <div className="min-w-0 space-y-4">
        <SustainHeader
          sectionId="commitment"
          title="Commitment"
          description="Four responsibility cards."
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the commitment…"}
        </p>
      </div>
    );
  }

  const visible = commitment.items.filter((item) => item.isActive !== false);

  return (
    <div className="min-w-0 space-y-4">
      <SustainHeader
        sectionId="commitment"
        title="Commitment"
        description="Four responsibility cards."
        extra={<AddButton onClick={() => setEdit("new")}>Add card</AddButton>}
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
            Shown on the sustainability page. Hidden cards stay off this
            preview.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl bg-[#f5f6f8] p-4 sm:p-5">
            <div className="mx-auto mb-5 max-w-2xl text-center">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                {commitment.kicker}
              </p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {commitment.title}
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                {commitment.subtitle}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(item.id)}
                    className="h-full w-full rounded-2xl border border-neutral-200/90 bg-white p-4 text-center"
                  >
                    <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MaterialIcon
                        name={item.icon || "notes"}
                        filled
                        className="text-[20px]"
                      />
                    </span>
                    <span className="block text-sm font-semibold text-neutral-950">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-600">
                      {item.description}
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
            kicker: commitment.kicker,
            title: commitment.title,
            subtitle: commitment.subtitle,
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
        headingId="sustain-commit-list"
        title={
          commitment.items.length === 1
            ? "1 card"
            : `${commitment.items.length} cards`
        }
        emptyTitle="No cards yet"
        emptyBody="Add the responsibility cards."
        emptyAction="Add card"
        onEmpty={() => setEdit("new")}
        items={commitment.items.map((item) => ({
          id: item.id,
          buttonId: `sustain-commit-${item.id}`,
          title: item.title || "Empty card",
          active: item.isActive !== false,
          meta: item.description || iconLabel(item.icon),
          reorder: item.title || "card",
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
        removeLabel="Remove card"
      />
      {drawerOpen ? (
        <DrawerOverlay titleId="sustain-commit-drawer">
          <CardPanel
            key={selected}
            creating={creating}
            noun="Card"
            titleId="sustain-commit-drawer"
            initial={
              opened
                ? {
                    icon: opened.icon,
                    title: opened.title,
                    description: opened.description,
                    isActive: opened.isActive,
                  }
                : {
                    icon: "verified",
                    title: "",
                    description: "",
                    isActive: true,
                  }
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
