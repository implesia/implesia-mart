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
import { useConfirmDelete, useConfirmDeleteOpen } from "../_components/confirm-delete";

const STATUS_TONE: Record<InquiryStatus, string> = {
  new: "bg-amber-50 text-amber-700 ring-amber-200/60",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-200/60",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
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
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset", STATUS_TONE[status])}>
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
    /* Ekhane w-full max-w-none add kora hoyeche jate full width hoy */
    <div className="w-full max-w-none space-y-5 pb-10">
      <AdminPageHeader
        title="Inquiries"
        description="Messages and newsletter sign-ups from the storefront. Every field a visitor leaves is optional."
      />

      {/* Summary Cards */}
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
              "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#2bc0b5]/40 hover:shadow-md",
              status === key && "border-[#2bc0b5] ring-1 ring-[#2bc0b5]",
            )}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#2bc0b5]/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
              <span className="mt-1 block text-2xl font-bold tabular-nums text-slate-900">{value ?? "—"}</span>
            </div>
          </button>
        ))}
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5">
          <label className="relative block min-w-0">
            <span className="sr-only">Search inquiries</span>
            <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, subject or message..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/20"
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
              className="self-start text-xs font-semibold text-[#2bc0b5] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-rose-700">
            <span>{error}</span>
            <button type="button" onClick={() => setReload((v) => v + 1)} className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold hover:bg-rose-50">
              Try again
            </button>
          </div>
        ) : null}
        
        {loading && !directory && !error ? (
          <div aria-busy="true" aria-label="Loading inquiries" className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
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
            {/* Mobile List */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {directory.items.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setParam("open", item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2bc0b5]/10 text-[#2bc0b5]">
                      <MaterialIcon name={TYPE_ICON[item.type]} className="text-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-slate-900">{contactLine(item)}</span>
                        <StatusPill status={item.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{preview(item)}</span>
                      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {INQUIRY_TYPE_LABEL[item.type]} · {formatWhen(item.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <caption className="sr-only">Inquiries, {sort === "newest" ? "newest" : "oldest"} first</caption>
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Source</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Contact</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Message</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      <button type="button" onClick={() => setParam("sort", sort === "newest" ? "oldest" : null)} className="inline-flex items-center gap-1 font-semibold hover:text-slate-900" aria-label={`Date, sorted ${sort} first. Change sort`}>
                        Date
                        <MaterialIcon name={sort === "newest" ? "arrow_downward" : "arrow_upward"} className="text-[14px]" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {directory.items.map((item) => (
                    <tr key={item.id} className={cn("group transition-colors hover:bg-slate-50/80", item.status === "new" && "bg-[#2bc0b5]/5")}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                          <MaterialIcon name={TYPE_ICON[item.type]} className="text-[16px] text-[#2bc0b5]" />
                          {INQUIRY_TYPE_LABEL[item.type]}
                        </span>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3">
                        <button type="button" onClick={() => setParam("open", item.id)} className="block max-w-full truncate text-left text-sm font-medium text-slate-900 hover:text-[#2bc0b5] focus-visible:outline-none">
                          {contactLine(item)}
                        </button>
                        <span className="block truncate text-[11px] font-medium text-slate-500">{[item.email, item.phone].filter(Boolean).join(" · ") || "No contact details"}</span>
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <span className="line-clamp-2 text-xs font-medium text-slate-600">{preview(item)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusSelect item={item} onChange={changeStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] font-medium text-slate-500 tabular-nums">{formatWhen(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Pagination */}
        {directory && directory.total > 0 ? (
          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-medium text-slate-600">
            <span>
              Showing <span className="font-bold text-slate-900">{(directory.page - 1) * directory.pageSize + 1}–{Math.min(directory.page * directory.pageSize, directory.total)}</span> of <span className="font-bold text-slate-900">{directory.total}</span> inquiries
            </span>
            <span className="flex gap-2">
              <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-slate-50 disabled:opacity-50" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>Previous</button>
              <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-slate-50 disabled:opacity-50" disabled={page >= directory.pages} onClick={() => setParam("page", String(page + 1))}>Next</button>
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
          setReload((v) => v + 1);
        }}
        onError={(message) => notify(message, "error")}
      />

      {/* Toast Notification */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
        {toast ? (
          <p key={toast.key} className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2", toast.tone === "ok" ? "bg-slate-900" : "bg-rose-600")}>
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
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/20">
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
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/20" />
    </label>
  );
}

function StatusSelect({ item, onChange, className }: { item: Inquiry; onChange: (item: Inquiry, s: InquiryStatus) => void; className?: string }) {
  return (
    <select
      aria-label={`Status for ${contactLine(item)}`}
      value={item.status}
      onChange={(e) => onChange(item, e.target.value as InquiryStatus)}
      className={cn("h-8 cursor-pointer rounded-md px-2.5 text-[11px] font-bold uppercase tracking-wide outline-none ring-1 ring-inset transition focus:ring-2 focus:ring-[#2bc0b5]", STATUS_TONE[item.status], className)}
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
  const [note, setNote] = useState(item?.adminNote ?? "");
  const [busy, setBusy] = useState<"status" | "note" | "delete" | null>(null);
  const confirmDelete = useConfirmDelete();
  const confirming = useConfirmDeleteOpen();

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

  function remove() {
    if (!item) return;
    const id = item.id;
    void confirmDelete({
      title: "Delete this inquiry?",
      description: "It will be deleted permanently. This cannot be undone.",
      successMessage: "Inquiry deleted.",
      errorMessage: "Could not delete.",
      onConfirm: async () => {
        setBusy("delete");
        try {
          await deleteInquiry(id);
        } finally {
          setBusy(null);
        }
        onDeleted();
      },
    });
  }

  const meta = Object.entries(item.meta).filter(([, v]) => v);

  return (
    <Sheet
      open={open}
      modal={!confirming}
      disablePointerDismissal={confirming}
      onOpenChange={(next) => (next ? null : onClose())}
    >
      <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-lg data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2bc0b5]/10 text-[#2bc0b5]">
              <MaterialIcon name={TYPE_ICON[item.type]} className="text-[14px]" />
            </div>
            {INQUIRY_TYPE_LABEL[item.type]} · {formatWhen(item.createdAt)}
          </div>
          <SheetTitle className="mt-2 text-lg font-bold text-slate-900">{contactLine(item)}</SheetTitle>
          <SheetDescription className="sr-only">Inquiry details, quick replies and status</SheetDescription>
          <div className="mt-2"><StatusPill status={item.status} /></div>
        </SheetHeader>

        <div className="space-y-5 px-5 py-5">
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2.5 text-sm">
            {(
              [
                ["Name", item.name],
                ["Email", item.email],
                ["Phone", item.phone],
                ["Subject", item.subject],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-medium text-slate-500">{label}</dt>
                <dd className="break-words font-medium text-slate-900">{value || <span className="italic text-slate-400">Not given</span>}</dd>
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
            <h3 id="inquiry-message-heading" className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Message</h3>
            <p className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800">
              {item.message || (item.type === "newsletter" ? "Newsletter sign-up — no message." : "No message.")}
            </p>
            {meta.length ? (
              <p className="mt-2 text-[11px] font-medium text-slate-400">
                {meta.map(([k, v]) => `${k.replace("_", " ")}: ${String(v)}`).join(" · ")}
              </p>
            ) : null}
          </section>

          <div>
            <label htmlFor="inquiry-status" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              id="inquiry-status"
              value={item.status}
              disabled={busy === "status"}
              onChange={(e) => {
                const next = e.target.value as InquiryStatus;
                void save({ status: next }, "status", `Marked as ${INQUIRY_STATUS_LABEL[next].toLowerCase()}.`);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/20"
            >
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inquiry-note" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Internal note</label>
            <textarea
              id="inquiry-note"
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Only admins see this."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm leading-relaxed outline-none transition focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/20"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-500">{item.handledByName ? `Last handled by ${item.handledByName}` : ""}</span>
              <button
                type="button"
                disabled={busy === "note" || note.trim() === item.adminNote}
                onClick={() => void save({ adminNote: note }, "note", "Note saved.")}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-[#2bc0b5] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#24a39a] disabled:opacity-50"
              >
                {busy === "note" ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <button type="button" disabled={busy === "delete"} onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
              <MaterialIcon name="delete" className="text-[16px]" />
              Delete inquiry
            </button>
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
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#2bc0b5]/40 hover:text-[#2bc0b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40"
    >
      <MaterialIcon name={icon} className="text-[16px] text-[#2bc0b5]" />
      {label}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2bc0b5]" />
      </div>
    }>
      <InquiriesView />
    </Suspense>
  );
}