"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass, FieldLabel } from "../../_components/admin-ui";

export type CopyField = {
  name: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  wide?: boolean;
};

export function SectionCopyForm({
  values,
  fields,
  onSave,
  saveLabel = "Save heading",
}: {
  values: Record<string, string>;
  fields: CopyField[];
  onSave: (next: Record<string, string>) => void;
  saveLabel?: string;
}) {
  const [notice, setNotice] = useState("");
  const snapshot = fields.map((field) => values[field.name] ?? "").join("\u0000");

  return (
    <div>
      <SectionCopyFields
        key={snapshot}
        values={values}
        fields={fields}
        saveLabel={saveLabel}
        onSave={(next) => {
          onSave(next);
          setNotice("Saved.");
          window.setTimeout(() => setNotice(""), 1600);
        }}
      />
      {notice ? (
        <p role="status" className="mt-3 text-sm font-medium text-emerald-800">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function SectionCopyFields({
  values,
  fields,
  onSave,
  saveLabel,
}: {
  values: Record<string, string>;
  fields: CopyField[];
  onSave: (next: Record<string, string>) => void;
  saveLabel: string;
}) {
  const [draft, setDraft] = useState(() => Object.fromEntries(fields.map((field) => [field.name, values[field.name] ?? ""])));
  const baseId = useId();
  const dirty = fields.some((field) => draft[field.name] !== (values[field.name] ?? ""));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!dirty) return;
        onSave(draft);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
            <FieldLabel htmlFor={`${baseId}-${field.name}`}>{field.label}</FieldLabel>
            {field.multiline ? (
              <textarea
                id={`${baseId}-${field.name}`}
                value={draft[field.name] ?? ""}
                rows={field.rows ?? 3}
                onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })}
                className={cn(adminFieldClass, "h-auto py-3")}
              />
            ) : (
              <input
                id={`${baseId}-${field.name}`}
                value={draft[field.name] ?? ""}
                onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })}
                className={adminFieldClass}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!dirty} className={adminButtonClass.primary}>
          {saveLabel}
        </button>
        {dirty ? <p className="text-xs text-neutral-500">Not saved yet.</p> : null}
      </div>
    </form>
  );
}
