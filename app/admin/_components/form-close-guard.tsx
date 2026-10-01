"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

export function sameFormSnapshot(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Close and Cancel buttons opt in with data-form-dismiss.
 * Backdrop clicks and Escape never reach this guard.
 */
export function FormCloseGuard({
  baseline,
  value,
  onClose,
  children,
}: {
  baseline: unknown;
  value: unknown;
  onClose: () => void;
  children: ReactNode;
}) {
  const baselineRef = useRef(baseline);
  const valueRef = useRef(value);
  const onCloseRef = useRef(onClose);
  baselineRef.current = baseline;
  valueRef.current = value;
  onCloseRef.current = onClose;
  const [confirming, setConfirming] = useState(false);

  function requestClose() {
    if (sameFormSnapshot(baselineRef.current, valueRef.current)) {
      onCloseRef.current();
      return;
    }
    setConfirming(true);
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest("[data-form-dismiss]")) return;
    event.preventDefault();
    event.stopPropagation();
    requestClose();
  }

  return (
    <>
      <div className="contents" onClickCapture={onClickCapture}>
        {children}
      </div>
      {confirming ? (
        <UnsavedChangesDialog
          onStay={() => setConfirming(false)}
          onDiscard={() => {
            setConfirming(false);
            onCloseRef.current();
          }}
        />
      ) : null}
    </>
  );
}
