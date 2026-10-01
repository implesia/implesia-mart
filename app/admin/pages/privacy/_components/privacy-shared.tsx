"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";

import {
  AdminFormModal,
  type AdminFormModalSize,
} from "../../../_components/admin-form-modal";
import {
  adminButtonClass,
  adminFieldClass,
  AdminPageHeader,
  FieldError,
  FieldLabel,
  VisibilityBadge,
} from "../../../_components/admin-ui";
import { findCmsPage } from "../../../_config/cms";

export const PRIVACY_ICONS: { name: string; label: string }[] = [
  { name: "info", label: "Info" },
  { name: "database", label: "Data" },
  { name: "query_stats", label: "Use" },
  { name: "share", label: "Share" },
  { name: "gavel", label: "Rights" },
  { name: "support_agent", label: "Support" },
  { name: "person_search", label: "Person" },
  { name: "devices", label: "Device" },
  { name: "shopping_cart_checkout", label: "Order" },
  { name: "verified_user", label: "Protected" },
  { name: "lock", label: "Lock" },
  { name: "shield", label: "Shield" },
  { name: "local_shipping", label: "Delivery" },
  { name: "visibility", label: "View" },
  { name: "edit", label: "Edit" },
  { name: "delete", label: "Delete" },
  { name: "block", label: "Block" },
];

function iconChoices(current: string) {
  if (PRIVACY_ICONS.some((icon) => icon.name === current)) return PRIVACY_ICONS;
  return [{ name: current, label: current }, ...PRIVACY_ICONS];
}

export function usePrivacyNav() {
  const pathname = usePathname();
  const router = useRouter();
  return { pathname, router };
}

export function setPrivacyQuery(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  open: boolean,
  value: string,
) {
  const next = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  if (open) next.set("edit", value);
  else next.delete("edit");
  const query = next.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
}

export function PrivacyHeader({
  sectionId,
  title,
  description,
  editLabel,
  onEdit,
  editRef,
}: {
  sectionId: string;
  title: string;
  description: string;
  editLabel: string;
  onEdit: () => void;
  editRef?: RefObject<HTMLButtonElement | null>;
}) {
  const page = findCmsPage("privacy");
  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1 text-sm text-neutral-500"
      >
        <Link
          href="/admin/pages/privacy"
          className="font-medium hover:text-neutral-950"
        >
          Privacy
        </Link>
        <MaterialIcon
          name="chevron_right"
          className="text-[16px] text-neutral-300"
        />
        <span className="font-medium text-neutral-950">{title}</span>
      </nav>
      {page ? (
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          aria-label="Privacy sections"
        >
          {page.sections.map((section) => {
            const active = section.id === sectionId;
            return (
              <Link
                key={section.id}
                href={`${page.href}/${section.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "bg-neutral-950 font-medium text-white"
                    : "bg-white font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      ) : null}
      <AdminPageHeader
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className={adminButtonClass.secondary}
            >
              View on site
              <MaterialIcon name="open_in_new" className="text-[18px]" />
            </a>
            <button
              ref={editRef}
              type="button"
              onClick={onEdit}
              className={adminButtonClass.primary}
            >
              <MaterialIcon name="edit" className="text-[18px]" />
              {editLabel}
            </button>
          </div>
        }
      />
    </div>
  );
}

export function useReturnFocus(editing: boolean) {
  const focusEdit = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    focusEdit.current?.focus();
  }, [editing]);
  return {
    focusEdit,
    markReturn: () => {
      returnFocus.current = true;
    },
  };
}

export function PrivacyPanel({
  headingId,
  title,
  description,
  active,
  children,
}: {
  headingId: string;
  title: string;
  description: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
    >
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2
          id={headingId}
          className="flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-950"
        >
          {title}
          {active === undefined ? null : <VisibilityBadge active={active} />}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div
        className={cn(
          "bg-admin-canvas p-4 sm:p-5",
          active === false && "opacity-45",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function PrivacyModal({
  titleId,
  title,
  description,
  size = "md",
  saving,
  onClose,
  onSave,
  children,
}: {
  titleId: string;
  title: string;
  description: string;
  size?: AdminFormModalSize;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <AdminFormModal titleId={titleId} size={size}>
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold text-neutral-950">
            {title}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>
        <button
          type="button"
          data-form-dismiss=""
          aria-label="Close"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <MaterialIcon name="close" className="text-[20px]" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
        {children}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
        <button
          type="button"
          data-form-dismiss=""
          onClick={onClose}
          className={adminButtonClass.secondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={adminButtonClass.primary}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </AdminFormModal>
  );
}

export function Labeled({
  id,
  label,
  required,
  value,
  placeholder,
  invalid,
  onChange,
  multiline,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const className = cn(
    adminFieldClass,
    invalid && "border-red-400",
    multiline && "h-auto py-3",
  );
  return (
    <div>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </FieldLabel>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </div>
  );
}

export function ItemToolbar({
  index,
  total,
  noun,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  noun: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const number = index + 1;
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-neutral-950">
        {noun} {number}
      </p>
      <div className="flex items-center">
        <IconButton
          label={`Move ${noun.toLowerCase()} ${number} earlier`}
          icon="arrow_upward"
          disabled={index === 0}
          onClick={() => onMove(-1)}
        />
        <IconButton
          label={`Move ${noun.toLowerCase()} ${number} later`}
          icon="arrow_downward"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
        />
        <IconButton
          label={`Remove ${noun.toLowerCase()} ${number}`}
          icon="delete"
          danger
          onClick={onRemove}
        />
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30",
        danger && "hover:bg-red-50 hover:text-red-600",
      )}
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}

export function VisibilitySwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm text-neutral-600">
        {checked ? "Visible on the website" : "Hidden from the website"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          checked ? "bg-primary" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function PrivacyIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div>
      <FieldLabel>Icon</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {iconChoices(value).map((icon) => (
          <button
            key={icon.name}
            type="button"
            aria-pressed={value === icon.name}
            aria-label={icon.label}
            onClick={() => onChange(icon.name)}
            className={cn(
              "grid size-10 place-items-center rounded-xl ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              value === icon.name
                ? "bg-primary/10 text-primary ring-primary/30"
                : "bg-white text-neutral-600 ring-neutral-200",
            )}
          >
            <MaterialIcon name={icon.name} className="text-[20px]" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  return <FieldError message={message} />;
}

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={adminButtonClass.secondary}
    >
      <MaterialIcon name="add" className="text-[18px]" />
      {label}
    </button>
  );
}
