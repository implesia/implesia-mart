"use client";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankFaq,
  blankGalleryImage,
  blankSpec,
  SPEC_GROUP_OPTIONS,
  type ProductFaqRow,
  type ProductGalleryImage,
  type ProductSpecRow,
  type ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
} from "../../_components/admin-ui";
import { ImageField } from "../../_components/image-field";

export function ProductCopyFields({
  formId,
  content,
  onChange,
}: {
  formId: string;
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <FieldLabel htmlFor={`${formId}-tagline`}>
          Label above the name
        </FieldLabel>
        <input
          id={`${formId}-tagline`}
          value={content.tagline}
          onChange={(event) =>
            onChange({ ...content, tagline: event.target.value })
          }
          placeholder="Shown above the product name"
          className={adminFieldClass}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${formId}-description`}>
          Product description
        </FieldLabel>
        <textarea
          id={`${formId}-description`}
          value={content.description}
          onChange={(event) =>
            onChange({ ...content, description: event.target.value })
          }
          rows={5}
          placeholder="The paragraph under the product name"
          className={cn(adminFieldClass, "h-auto py-3 leading-relaxed")}
        />
      </div>
    </div>
  );
}

export function ProductGalleryFields({
  content,
  onChange,
  onBusy,
}: {
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
  onBusy: (busy: boolean) => void;
}) {
  function update(index: number, patch: Partial<ProductGalleryImage>) {
    onChange({
      ...content,
      gallery: content.gallery.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <div className="mt-5 border-t border-neutral-100 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Gallery</h3>
          <p className="mt-1 text-sm text-neutral-500">
            These photos appear on the product page. The catalog image above is
            the thumbnail. An existing product video stays first and is not
            edited here.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...content,
              gallery: [...content.gallery, blankGalleryImage()],
            })
          }
          className={adminButtonClass.secondary}
        >
          Add photo
        </button>
      </div>
      {content.gallery.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          No gallery photos. The product page uses the catalog image.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {content.gallery.map((item, index) => (
            <li
              key={item.id}
              className="rounded-2xl bg-[#f7f8fa] p-3 ring-1 ring-neutral-200"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500">
                  Photo {index + 1}
                </p>
                <RowActions
                  label={`gallery photo ${index + 1}`}
                  disableUp={index === 0}
                  disableDown={index === content.gallery.length - 1}
                  onUp={() =>
                    onChange({
                      ...content,
                      gallery: move(content.gallery, index, index - 1),
                    })
                  }
                  onDown={() =>
                    onChange({
                      ...content,
                      gallery: move(content.gallery, index, index + 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...content,
                      gallery: content.gallery.filter(
                        (row) => row.id !== item.id,
                      ),
                    })
                  }
                />
              </div>
              <ImageField
                compact
                label=""
                value={item.src}
                onChange={(src) => update(index, { src })}
                onBusy={onBusy}
              />
              <label className="mt-3 block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Photo description
                </span>
                <input
                  value={item.alt}
                  onChange={(event) =>
                    update(index, { alt: event.target.value })
                  }
                  placeholder="What is in this photo"
                  className={adminFieldClass}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductDetailFields({
  formId,
  content,
  onChange,
}: {
  formId: string;
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  return (
    <div className="space-y-6">
      <LineList
        label="Highlights"
        hint="Checklist under the price on the product page."
        items={content.highlights}
        placeholder="Highlight"
        addLabel="Add highlight"
        onChange={(highlights) => onChange({ ...content, highlights })}
      />
      <LineList
        label="Suitable for"
        hint="Shown in the buy box and again on the details tab."
        items={content.suitableFor}
        placeholder="Who or what it is for"
        addLabel="Add item"
        onChange={(suitableFor) => onChange({ ...content, suitableFor })}
      />
      <div className="border-t border-neutral-100 pt-5">
        <h3 className="text-sm font-semibold text-neutral-950">Details tab</h3>
        <p className="mt-1 text-sm text-neutral-500">
          The story customers read on the details tab.
        </p>
        <div className="mt-4 grid gap-4">
          <div>
            <FieldLabel htmlFor={`${formId}-story-heading`}>Heading</FieldLabel>
            <input
              id={`${formId}-story-heading`}
              value={content.storyHeading}
              onChange={(event) =>
                onChange({ ...content, storyHeading: event.target.value })
              }
              className={adminFieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-story-body`}>Story</FieldLabel>
            <textarea
              id={`${formId}-story-body`}
              value={content.storyBody}
              rows={5}
              onChange={(event) =>
                onChange({ ...content, storyBody: event.target.value })
              }
              className={cn(adminFieldClass, "h-auto py-3 leading-relaxed")}
            />
          </div>
          <LineList
            label="Story points"
            hint="Short points under the story."
            items={content.storyBullets}
            placeholder="Point"
            addLabel="Add point"
            onChange={(storyBullets) => onChange({ ...content, storyBullets })}
          />
          <LineList
            label="How to use"
            hint="Numbered steps on the details tab."
            items={content.howToUse}
            placeholder="Step"
            addLabel="Add step"
            onChange={(howToUse) => onChange({ ...content, howToUse })}
          />
        </div>
      </div>
      <SpecList content={content} onChange={onChange} />
      <LineList
        label="What's included"
        hint="Package list on the specifications tab."
        items={content.packageItems}
        placeholder="Item in the package"
        addLabel="Add item"
        onChange={(packageItems) => onChange({ ...content, packageItems })}
      />
      <FaqList formId={formId} content={content} onChange={onChange} />
      <div className="border-t border-neutral-100 pt-5">
        <h3 className="text-sm font-semibold text-neutral-950">Quality note</h3>
        <p className="mt-1 text-sm text-neutral-500">
          The quality card on the details tab. The checklist beside it stays the
          same for every product.
        </p>
        <div className="mt-4 grid gap-4">
          <div>
            <FieldLabel htmlFor={`${formId}-quality-title`}>Title</FieldLabel>
            <input
              id={`${formId}-quality-title`}
              value={content.qualityTitle}
              onChange={(event) =>
                onChange({ ...content, qualityTitle: event.target.value })
              }
              className={adminFieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-quality-body`}>Text</FieldLabel>
            <textarea
              id={`${formId}-quality-body`}
              value={content.qualityBody}
              rows={3}
              onChange={(event) =>
                onChange({ ...content, qualityBody: event.target.value })
              }
              className={cn(adminFieldClass, "h-auto py-3 leading-relaxed")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecList({
  content,
  onChange,
}: {
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  function update(id: string, patch: Partial<ProductSpecRow>) {
    onChange({
      ...content,
      specs: content.specs.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <div className="border-t border-neutral-100 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">
            Specifications
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Rows on the specifications tab, grouped by topic. The first few also
            appear beside the gallery on large screens.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({ ...content, specs: [...content.specs, blankSpec()] })
          }
          className={adminButtonClass.secondary}
        >
          Add specification
        </button>
      </div>
      {content.specs.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No specifications yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {content.specs.map((item, index) => (
            <li
              key={item.id}
              className="rounded-2xl bg-[#f7f8fa] p-3 ring-1 ring-neutral-200"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500">
                  Specification {index + 1}
                </p>
                <RowActions
                  label={`specification ${index + 1}`}
                  disableUp={index === 0}
                  disableDown={index === content.specs.length - 1}
                  onUp={() =>
                    onChange({
                      ...content,
                      specs: move(content.specs, index, index - 1),
                    })
                  }
                  onDown={() =>
                    onChange({
                      ...content,
                      specs: move(content.specs, index, index + 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...content,
                      specs: content.specs.filter((row) => row.id !== item.id),
                    })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Group
                  </span>
                  <select
                    value={item.group}
                    aria-label={`Group for specification ${index + 1}`}
                    onChange={(event) =>
                      update(item.id, {
                        group: event.target.value as ProductSpecRow["group"],
                      })
                    }
                    className={adminFieldClass}
                  >
                    {SPEC_GROUP_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Specification
                  </span>
                  <input
                    value={item.label}
                    aria-label={`Name for specification ${index + 1}`}
                    onChange={(event) =>
                      update(item.id, { label: event.target.value })
                    }
                    className={adminFieldClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Value
                  </span>
                  <input
                    value={item.value}
                    aria-label={`Value for specification ${index + 1}`}
                    onChange={(event) =>
                      update(item.id, { value: event.target.value })
                    }
                    className={adminFieldClass}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FaqList({
  formId,
  content,
  onChange,
}: {
  formId: string;
  content: ProductStorefrontContent;
  onChange: (content: ProductStorefrontContent) => void;
}) {
  function update(id: string, patch: Partial<ProductFaqRow>) {
    onChange({
      ...content,
      faqs: content.faqs.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <div className="border-t border-neutral-100 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Questions</h3>
          <p className="mt-1 text-sm text-neutral-500">
            The questions tab. Leave this empty to hide that tab.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({ ...content, faqs: [...content.faqs, blankFaq()] })
          }
          className={adminButtonClass.secondary}
        >
          Add question
        </button>
      </div>
      {content.faqs.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No questions yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {content.faqs.map((item, index) => (
            <li
              key={item.id}
              className="rounded-2xl bg-[#f7f8fa] p-3 ring-1 ring-neutral-200"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500">
                  Question {index + 1}
                </p>
                <RowActions
                  label={`question ${index + 1}`}
                  disableUp={index === 0}
                  disableDown={index === content.faqs.length - 1}
                  onUp={() =>
                    onChange({
                      ...content,
                      faqs: move(content.faqs, index, index - 1),
                    })
                  }
                  onDown={() =>
                    onChange({
                      ...content,
                      faqs: move(content.faqs, index, index + 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...content,
                      faqs: content.faqs.filter((row) => row.id !== item.id),
                    })
                  }
                />
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Question
                  </span>
                  <input
                    id={`${formId}-faq-q-${item.id}`}
                    value={item.question}
                    onChange={(event) =>
                      update(item.id, { question: event.target.value })
                    }
                    className={adminFieldClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Answer
                  </span>
                  <textarea
                    id={`${formId}-faq-a-${item.id}`}
                    value={item.answer}
                    rows={3}
                    onChange={(event) =>
                      update(item.id, { answer: event.target.value })
                    }
                    className={cn(
                      adminFieldClass,
                      "h-auto py-3 leading-relaxed",
                    )}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LineList({
  label,
  hint,
  items,
  placeholder,
  addLabel,
  onChange,
}: {
  label: string;
  hint: string;
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">{label}</h3>
          <p className="mt-1 text-sm text-neutral-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className={adminButtonClass.secondary}
        >
          {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">None yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="flex items-center gap-2">
              <input
                value={item}
                aria-label={`${label} ${index + 1}`}
                placeholder={placeholder}
                onChange={(event) =>
                  onChange(
                    items.map((row, rowIndex) =>
                      rowIndex === index ? event.target.value : row,
                    ),
                  )
                }
                className={adminFieldClass}
              />
              <RowActions
                label={`${label} ${index + 1}`}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
                onUp={() => onChange(move(items, index, index - 1))}
                onDown={() => onChange(move(items, index, index + 1))}
                onRemove={() =>
                  onChange(items.filter((_, rowIndex) => rowIndex !== index))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RowActions({
  label,
  disableUp,
  disableDown,
  onUp,
  onDown,
  onRemove,
}: {
  label: string;
  disableUp: boolean;
  disableDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center">
      <IconButton
        label={`Move ${label} up`}
        disabled={disableUp}
        onClick={onUp}
        icon="arrow_upward"
      />
      <IconButton
        label={`Move ${label} down`}
        disabled={disableDown}
        onClick={onDown}
        icon="arrow_downward"
      />
      <IconButton label={`Remove ${label}`} onClick={onRemove} icon="close" />
    </span>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-300"
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}
