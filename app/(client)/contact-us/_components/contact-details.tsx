"use client";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

export function ContactDetails({ className }: { className?: string }) {
  const { direct } = contactCopy;

  return (
    <div className={cn("flex flex-col justify-center space-y-lg", className)}>
      <div>
        <h2 className="font-headline-md text-primary">{direct.title}</h2>
        <p className="mt-md font-body-md text-on-surface-variant">{direct.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-md">
        {direct.channels.map((c) => (
          <div key={c.title} className="group flex items-start gap-md">
            <div className="rounded-lg bg-primary-container p-sm text-on-primary-container transition-transform group-hover:scale-110">
              <MaterialIcon name={c.icon} filled />
            </div>
            <div>
              <h4 className="font-label-md tracking-wider text-on-surface uppercase">
                {c.title}
              </h4>
              <p className="font-body-md text-outline">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-outline-variant/40 pt-md">
        <div className="inline-flex items-center rounded-full bg-tertiary-fixed px-sm py-xs text-on-tertiary-fixed">
          <MaterialIcon name="verified" className="mr-xs text-[16px]" filled />
          <span className="font-label-sm">{direct.badge}</span>
        </div>
      </div>
    </div>
  );
}

