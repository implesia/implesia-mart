"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { showContactToast } from "./contact-toast";

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy failed");
}

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await writeClipboard(value);
      setCopied(true);
      showContactToast(`${label} কপি হয়েছে`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showContactToast("কপি করা যায়নি — হাতে লিখে নিন", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label} কপি করুন: ${value}`}
      className={cn(
        "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full",
        "border border-neutral-200 bg-white text-neutral-600 transition-colors motion-reduce:transition-none",
        "hover:border-primary/50 hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink",
        copied && "border-primary/60 text-primary-ink",
        className,
      )}
    >
      <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[18px]" />
    </button>
  );
}
