"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPES,
  INQUIRY_TYPE_LABEL,
  deleteInquiry,
  listInquiries,
  patchInquiry,
  phoneLinks,
  type Inquiry,
  type InquiryDirectory,
  type InquiryStatus,
  type InquiryType,
} from "@/lib/mart-api/inquiries";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { AdminEmpty, AdminPageHeader } from "../_components/admin-ui";

const STATUS_TONE: Record<InquiryStatus, string> = {
  new: "bg-amber-100 text-amber-900 ring-amber-200",
  in_progress: "bg-sky-100 text-sky-900 ring-sky-200",
  resolved: "bg-emerald-100 text-emerald-900 ring-emerald-200",
};
const TYPE_ICON: Record<InquiryType, string> = {
  newsletter: "mark_email_read",
  contact: "chat",
  product_inquiry: "inventory_2",
  order_help: "receipt_long",
  other: "help",
};
const PAGE_SIZE = 20;

const isType = (v: string | null): v is InquiryType => INQUIRY_TYPES.some((t) => t === v);
const isStatus = (v: string | null): v is InquiryStatus => INQUIRY_STATUSES.some((s) => s === v);

function errorText(reason: unknown, fallback: string) {
  return reason instanceof MartApiError ? reason.message : fallback;
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(new Date(iso));
}

function contactLine(item: Inquiry) {
  return item.name || item.email || item.phone || "Anonymous";
}

function preview(item: Inquiry) {
  const text = item.subject || item.message;
  if (text) return text;
  return item.type === "newsletter" ? "Newsletter sign-up" : "—";
}

function StatusPill({ status }: { status: InquiryStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", STATUS_TONE[status])}>
      {INQUIRY_STATUS_LABEL[status]}
    </span>
  );
}

type Toast = { message: string; tone: "ok" | "error"; key: number };

function InquiriesView() {
  const params = useSearchParams();
  const router = useRouter();
  const type = isType(params.get("type")) ? (params.get("type") as InquiryType) : null;
  const status = isStatus(params.get("status")) ? (params.get("status") as InquiryStatus) : null;
  const sort = params.get("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const dateFrom = params.get("from") ?? "";
  const dateTo = params.get("to") ?? "";
  const openId = params.get("open");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [directory, setDirectory] = useState<InquiryDirectory | null>(null);
  // Loading is derived: the request key we last finished differs from the current one.
  const [settledKey, setSettledKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    setToast({ message, tone, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const replace = useCallback(
    (mutate: (search: URLSearchParams) => void) => {
      const search = new URLSearchParams(params.toString());
      mutate(search);
      const next = search.toString();
      router.replace(next ? `/admin/inquiries?${next}` : "/admin/inquiries", { scroll: false });
    },
    [params, router],
  );

  function setParam(key: string, value: string | null) {
    replace((search) => {
      if (value) search.set(key, value);
      else search.delete(key);
      if (key !== "page" && key !== "open") search.delete("page");
    });
  }

  useEffect(() => {
    const wanted = query.trim();
    if (wanted === (params.get("q") ?? "")) return;
    const handle = window.setTimeout(() => setParam("q", wanted || null), 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const requestKey = `${params.toString()}#${reload}`;
  const loading = settledKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    listInquiries({ q: params.get("q") ?? "", type, status, sort, page, dateFrom, dateTo, pageSize: PAGE_SIZE })
      .then((next) => {
        if (cancelled) return;
        setDirectory(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(errorText(reason, "Could not load inquiries."));
      })
      .finally(() => {
        if (!cancelled) setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [params, type, status, sort, page, dateFrom, dateTo, reload, requestKey]);

  const selected = directory?.items.find((item) => item.id === openId) ?? null;

  function replaceItem(saved: Inquiry) {
    setDirectory((current) =>
      current ? { ...current, items: current.items.map((item) => (item.id === saved.id ? saved : item)) } : current,
    );
  }

  async function changeStatus(item: Inquiry, next: InquiryStatus) {
    const before = item;
    replaceItem({ ...item, status: next });
    try {
      replaceItem(await patchInquiry(item.id, { status: next }));
      notify(`Marked as ${INQUIRY_STATUS_LABEL[next].toLowerCase()}.`);
      setReload((v) => v + 1);
    } catch (reason) {
      replaceItem(before);
      notify(errorText(reason, "Could not update the status."), "error");
    }
  }

  const counts = directory?.counts;
  const filtered = Boolean(params.get("q") || type || status || dateFrom || dateTo);

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Inquiries"
        description="Messages and newsletter sign-ups from the storefront. Every field a visitor leaves is optional."
      />

      <section aria-label="Inquiry summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["All", counts?.total, null],
            ["New", counts?.new, "new"],
            ["In progress", counts?.inProgress, "in_progress"],
            ["Resolved", counts?.resolved, "resolved"],
          ] as const
        ).map(([label, value, key]) => (
          <button
            key={label}
            type="button"
            onClick={() => setParam("status", key)}
            aria-pressed={status === key}
            className={cn(
              "rounded-2xl bg-white p-4 text-left ring-1 ring-neutral-200/90 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary",
              status === key && "ring-2 ring-primary",
            )}
          >
            <span className="block text-xs font-medium text-neutral-500">{label}</span>
            <span className="mt-1 block text-xl font-semibold tabular-nums text-neutral-950">{value ?? "—"}</span>
          </button>
        ))}
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <label className="relative block min-w-0">
            <span className="sr-only">Search inquiries</span>
            <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, subject or message"
              className="h-11 w-full rounded-full border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <FilterSelect label="Source" value={type ?? ""} onChange={(v) => setParam("type", v || null)} options={[["", "All sources"], ...INQUIRY_TYPES.map((t) => [t, INQUIRY_TYPE_LABEL[t]] as const)]} />
            <FilterSelect label="Status" value={status ?? ""} onChange={(v) => setParam("status", v || null)} options={[["", "Any status"], ...INQUIRY_STATUSES.map((s) => [s, INQUIRY_STATUS_LABEL[s]] as const)]} />
            <FilterDate label="From" value={dateFrom} onChange={(v) => setParam("from", v || null)} />
            <FilterDate label="To" value={dateTo} onChange={(v) => setParam("to", v || null)} />
            <FilterSelect label="Sort" value={sort} onChange={(v) => setParam("sort", v === "newest" ? null : v)} options={[["newest", "Newest first"], ["oldest", "Oldest first"]]} />
          </div>
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                replace((s) => ["q", "type", "status", "from", "to", "page"].forEach((k) => s.delete(k)));
              }}
              className="self-start text-sm font-semibold text-primary-ink hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setReload((v) => v + 1)} className="min-h-10 rounded-full px-4 font-semibold ring-1 ring-red-200 hover:bg-red-50">
              Try again
            </button>
          </div>
        ) : null}
        {loading && !directory && !error ? (
          <div aria-busy="true" aria-label="Loading inquiries" className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : null}
        {directory && directory.items.length === 0 ? (
          <AdminEmpty
            title={filtered ? "No inquiries match" : "No inquiries yet"}
            detail={filtered ? "Try a different search or clear the filters." : "Contact form messages and newsletter sign-ups will show up here."}
          />
        ) : null}

        {directory && directory.items.length > 0 ? (
          <div className={cn(loading && "opacity-60 transition-opacity")} aria-busy={loading}>
            <ul className="divide-y divide-neutral-100 lg:hidden">
              {directory.items.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setParam("open", item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-ink">
                      <MaterialIcon name={TYPE_ICON[item.type]} className="text-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-neutral-950">{contactLine(item)}</span>
                        <StatusPill status={item.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-neutral-600">{preview(item)}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {INQUIRY_TYPE_LABEL[item.type]} · {formatWhen(item.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <caption className="sr-only">Inquiries, {sort === "newest" ? "newest" : "oldest"} first</caption>
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Source</th>
                    <th scope="col" className="px-4 py-3 font-medium">Contact</th>
                    <th scope="col" className="px-4 py-3 font-medium">Message</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => setParam("sort", sort === "newest" ? "oldest" : null)} className="inline-flex items-center gap-1 font-medium hover:text-neutral-900" aria-label={`Date, sorted ${sort} first. Change sort`}>
                        Date
                        <MaterialIcon name={sort === "newest" ? "arrow_downward" : "arrow_upward"} className="text-[14px]" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {directory.items.map((item) => (
                    <tr key={item.id} className={cn("border-t border-neutral-100 hover:bg-neutral-50", item.status === "new" && "bg-amber-50/40")}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-neutral-700">
                          <MaterialIcon name={TYPE_ICON[item.type]} className="text-[18px] text-primary-ink" />
                          {INQUIRY_TYPE_LABEL[item.type]}
                        </span>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3">
                        <button type="button" onClick={() => setParam("open", item.id)} className="block max-w-full truncate text-left font-semibold text-neutral-950 hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-primary">
                          {contactLine(item)}
                        </button>
                        <span className="block truncate text-xs text-neutral-500">{[item.email, item.phone].filter(Boolean).join(" · ") || "No contact details"}</span>
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <span className="line-clamp-2 text-neutral-700">{preview(item)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusSelect item={item} onChange={changeStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600 tabular-nums">{formatWhen(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {directory && directory.total > 0 ? (
          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 text-sm">
            <span className="text-neutral-600">
              {(directory.page - 1) * directory.pageSize + 1}–{Math.min(directory.page * directory.pageSize, directory.total)} of {directory.total}
            </span>
            <span className="flex gap-2">
              <button type="button" className="min-h-10 rounded-full px-4 ring-1 ring-neutral-200 disabled:opacity-40" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>Previous</button>
              <button type="button" className="min-h-10 rounded-full px-4 ring-1 ring-neutral-200 disabled:opacity-40" disabled={page >= directory.pages} onClick={() => setParam("page", String(page + 1))}>Next</button>
            </span>
          </nav>
        ) : null}
      </section>

      <InquiryDrawer
        key={selected?.id ?? "none"}
        item={selected}
        open={Boolean(openId && selected)}
        onClose={() => setParam("open", null)}
        onSaved={(saved, message) => {
          replaceItem(saved);
          notify(message);
          setReload((v) => v + 1);
        }}
        onDeleted={() => {
          setParam("open", null);
          notify("Inquiry deleted.");
          setReload((v) => v + 1);
        }}
        onError={(message) => notify(message, "error")}
      />

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
        {toast ? (
          <p key={toast.key} className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl", toast.tone === "ok" ? "bg-neutral-900" : "bg-red-700")}>
            <MaterialIcon name={toast.tone === "ok" ? "check_circle" : "error"} className="text-[18px]" />
            {toast.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[] }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
    </label>
  );
}

function StatusSelect({ item, onChange, className }: { item: Inquiry; onChange: (item: Inquiry, s: InquiryStatus) => void; className?: string }) {
  return (
    <select
      aria-label={`Status for ${contactLine(item)}`}
      value={item.status}
      onChange={(e) => onChange(item, e.target.value as InquiryStatus)}
      className={cn("h-9 cursor-pointer rounded-full py-0 pr-7 pl-3 text-xs font-semibold ring-1 outline-none focus-visible:ring-2 focus-visible:ring-primary", STATUS_TONE[item.status], className)}
    >
      {INQUIRY_STATUSES.map((s) => (
        <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>
      ))}
    </select>
  );
}

function InquiryDrawer({
  item,
  open,
  onClose,
  onSaved,
  onDeleted,
  onError,
}: {
  item: Inquiry | null;
  open: boolean;
  onClose: () => void;
  onSaved: (saved: Inquiry, message: string) => void;
  onDeleted: () => void;
  onError: (message: string) => void;
}) {
  // The parent keys this component by inquiry id, so state starts fresh per inquiry.
  const [note, setNote] = useState(item?.adminNote ?? "");
  const [busy, setBusy] = useState<"status" | "note" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;
  const links = phoneLinks(item.phone);
  const subject = encodeURIComponent(item.subject ? `Re: ${item.subject}` : "Implesia Mart");

  async function save(patch: { status?: InquiryStatus; adminNote?: string }, kind: "status" | "note", message: string) {
    if (!item) return;
    setBusy(kind);
    try {
      onSaved(await patchInquiry(item.id, patch), message);
    } catch (reason) {
      onError(errorText(reason, "Could not save."));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!item) return;
    setBusy("delete");
    try {
      await deleteInquiry(item.id);
      onDeleted();
    } catch (reason) {
      onError(errorText(reason, "Could not delete."));
    } finally {
      setBusy(null);
    }
  }

  const meta = Object.entries(item.meta).filter(([, v]) => v);

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-lg data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <MaterialIcon name={TYPE_ICON[item.type]} className="text-[16px] text-primary-ink" />
            {INQUIRY_TYPE_LABEL[item.type]} · {formatWhen(item.createdAt)}
          </div>
          <SheetTitle className="text-lg font-semibold text-neutral-950">{contactLine(item)}</SheetTitle>
          <SheetDescription className="sr-only">Inquiry details, quick replies and status</SheetDescription>
          <StatusPill status={item.status} />
        </SheetHeader>

        <div className="space-y-5 px-5 py-4">
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
            {(
              [
                ["Name", item.name],
                ["Email", item.email],
                ["Phone", item.phone],
                ["Subject", item.subject],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-neutral-500">{label}</dt>
                <dd className="break-words text-neutral-950">{value || <span className="text-neutral-500">Not given</span>}</dd>
              </div>
            ))}
          </dl>

          {item.email || links ? (
            <div className="flex flex-wrap gap-2" aria-label="Quick replies">
              {item.email ? <QuickAction href={`mailto:${item.email}?subject=${subject}`} icon="mail" label="Email" /> : null}
              {links ? <QuickAction href={links.tel} icon="call" label="Call" /> : null}
              {links ? <QuickAction href={links.whatsapp} icon="chat" label="WhatsApp" external /> : null}
            </div>
          ) : null}

          <section aria-labelledby="inquiry-message-heading">
            <h3 id="inquiry-message-heading" className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">Message</h3>
            {/* Plain text: React escapes it, so stored HTML shows as text. */}
            <p className="rounded-xl bg-[#f5f6f8] p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-neutral-900">
              {item.message || (item.type === "newsletter" ? "Newsletter sign-up — no message." : "No message.")}
            </p>
            {meta.length ? (
              <p className="mt-2 text-xs text-neutral-500">
                {meta.map(([k, v]) => `${k.replace("_", " ")}: ${String(v)}`).join(" · ")}
              </p>
            ) : null}
          </section>

          <div>
            <label htmlFor="inquiry-status" className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Status</label>
            <select
              id="inquiry-status"
              value={item.status}
              disabled={busy === "status"}
              onChange={(e) => {
                const next = e.target.value as InquiryStatus;
                void save({ status: next }, "status", `Marked as ${INQUIRY_STATUS_LABEL[next].toLowerCase()}.`);
              }}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inquiry-note" className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500 uppercase">Internal note</label>
            <textarea
              id="inquiry-note"
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Only admins see this."
              className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500">{item.handledByName ? `Last handled by ${item.handledByName}` : ""}</span>
              <button
                type="button"
                disabled={busy === "note" || note.trim() === item.adminNote}
                onClick={() => void save({ adminNote: note }, "note", "Note saved.")}
                className="min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
              >
                {busy === "note" ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            {confirmDelete ? (
              <div role="alertdialog" aria-label="Delete this inquiry?" className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900">
                <span className="flex-1">Delete permanently? This cannot be undone.</span>
                <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-10 rounded-full px-4 font-semibold ring-1 ring-red-200">Cancel</button>
                <button type="button" disabled={busy === "delete"} onClick={() => void remove()} className="min-h-10 rounded-full bg-red-700 px-4 font-semibold text-white disabled:opacity-50">
                  {busy === "delete" ? "Deleting…" : "Delete"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                <MaterialIcon name="delete" className="text-[18px]" />
                Delete inquiry
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QuickAction({ href, icon, label, external = false }: { href: string; icon: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-neutral-900 ring-1 ring-neutral-200 hover:ring-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <MaterialIcon name={icon} className="text-[18px] text-primary-ink" />
      {label}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />}>
      <InquiriesView />
    </Suspense>
  );
}
