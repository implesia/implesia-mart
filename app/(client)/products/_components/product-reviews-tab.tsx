"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { isCatalogProductId } from "@/lib/mart-api/catalog-rules";
import {
  buildRatingBreakdown,
  buildReviewLoginHref,
  formatReviewDateBn,
  getCanReviewProduct,
  getProductReviews,
  REVIEW_RATING_LABELS,
  submitProductReview,
  validateReviewInput,
  type CanReviewResult,
  type ProductReviewPage,
} from "@/lib/mart-api/product-reviews";
import { cn } from "@/lib/utils";

import { CustomerAvatar } from "../../_components/common/customer-avatar";
import { MaterialIcon } from "../../_components/common/material-icon";
import type { ProductDetail } from "../../_data/products/product-details";
import { useCustomerAuth } from "../../_providers/customer-auth-provider";

const REVIEWS_PER_PAGE = 10;

const EMPTY_SUMMARY = {
  averageRating: 0,
  totalReviews: 0,
  ratingHistogram: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
};

function StarDisplay({
  value,
  sizeClass = "text-[18px]",
}: {
  value: number;
  sizeClass?: string;
}) {
  const filledCount = Math.round(value);
  return (
    <div
      className="inline-flex items-center gap-0.5 text-tertiary"
      aria-label={`${value.toFixed(1)} স্টার`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcon
          key={i}
          name="star"
          filled={i < filledCount}
          className={cn(
            sizeClass,
            i < filledCount ? "text-tertiary" : "text-outline-variant/60",
          )}
        />
      ))}
    </div>
  );
}

export function ProductReviewsTab({
  product,
  autoOpenForm = false,
  onTotalReviewsChange,
}: {
  product: Pick<ProductDetail, "id" | "slug" | "title" | "status">;
  autoOpenForm?: boolean;
  onTotalReviewsChange?: (count: number) => void;
}) {
  const { isAuthenticated, isLoading: authLoading, customer } = useCustomerAuth();
  const hasCatalogId = isCatalogProductId(product.id);

  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);
  const [reviewPage, setReviewPage] = useState<ProductReviewPage | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(hasCatalogId);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [eligibility, setEligibility] = useState<CanReviewResult | null>(null);
  const [eligibilityResolvedKey, setEligibilityResolvedKey] = useState<
    string | null
  >(null);

  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const autoOpenedRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const eligibilityKey =
    hasCatalogId && !authLoading && isAuthenticated
      ? `${product.id}:${customer?.id ?? "auth"}:${reloadTick}`
      : null;

  useEffect(() => {
    if (!hasCatalogId) return;
    let cancelled = false;

    void (async () => {
      try {
        const data = await getProductReviews(product.id, {
          page,
          pageSize: REVIEWS_PER_PAGE,
        });
        if (cancelled) return;
        setReviewPage(data);
        setReviewsError(null);
        onTotalReviewsChange?.(data.summary.totalReviews);
      } catch (err) {
        if (cancelled) return;
        setReviewsError(
          err instanceof Error
            ? err.message
            : "রিভিউগুলো লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
        );
      } finally {
        if (!cancelled) setLoadingReviews(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasCatalogId, onTotalReviewsChange, page, product.id, reloadTick]);

  useEffect(() => {
    if (!eligibilityKey) return;
    let cancelled = false;

    void (async () => {
      try {
        const result = await getCanReviewProduct(product.id);
        if (cancelled) return;
        setEligibility(result);
        if (result.canReview && autoOpenForm && !autoOpenedRef.current) {
          autoOpenedRef.current = true;
          setFormOpen(true);
        }
      } catch {
        if (!cancelled) setEligibility(null);
      } finally {
        if (!cancelled) setEligibilityResolvedKey(eligibilityKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoOpenForm, eligibilityKey, product.id]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activeEligibility = eligibilityKey ? eligibility : null;
  const loadingEligibility =
    Boolean(eligibilityKey) && eligibilityResolvedKey !== eligibilityKey;

  const summary = reviewPage?.summary ?? EMPTY_SUMMARY;
  const items = reviewPage?.items ?? [];
  const totalPages = Math.max(1, reviewPage?.pages ?? 1);
  const breakdown = useMemo(() => buildRatingBreakdown(summary), [summary]);
  const loginHref = useMemo(
    () => buildReviewLoginHref(product.slug),
    [product.slug],
  );

  const activeStarValue = (hoveredRating ?? rating) as 1 | 2 | 3 | 4 | 5;
  const alreadyReviewed = Boolean(
    activeEligibility &&
      !activeEligibility.canReview &&
      activeEligibility.reason.includes("ইতিমধ্যে"),
  );

  const triggerReload = useCallback((nextPage?: number) => {
    setLoadingReviews(true);
    setReviewsError(null);
    if (typeof nextPage === "number") {
      setPage(nextPage);
    }
    setReloadTick((t) => t + 1);
  }, []);

  function handleOpenForm() {
    setFormError(null);
    setFormOpen((prev) => {
      const next = !prev;
      if (next) {
        window.setTimeout(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 60);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const validation = validateReviewInput({ rating, headline, comment });
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      await submitProductReview(product.id, {
        rating,
        headline: headline.trim(),
        comment: comment.trim(),
      });
      setToastMessage(
        "ধন্যবাদ! আপনার ভেরিফাইড রিভিউ সফলভাবে প্রকাশ করা হয়েছে।",
      );
      setFormOpen(false);
      setRating(5);
      setHoveredRating(null);
      setHeadline("");
      setComment("");

      // Refresh page 1 & eligibility state immediately
      triggerReload(1);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "রিভিউ জমা দেওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="pb-6 sm:pb-10" aria-labelledby="pdp-reviews-heading">
      {/* Floating Bangla confirmation toast */}
      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-50 flex max-w-md items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-950 px-4 py-3 text-sm font-medium text-white shadow-xl sm:bottom-6 dark:border-emerald-700/60"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
            <MaterialIcon name="check_circle" filled className="text-[18px]" />
          </span>
          <span className="leading-snug">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="নোটিফিকেশন বন্ধ করুন"
            className="ml-auto rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <MaterialIcon name="close" className="text-[16px]" />
          </button>
        </div>
      ) : null}

      {/* Section Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <MaterialIcon name="verified" filled className="text-[15px]" />
            <span>ভেরিফাইড ক্রেতা রিভিউ</span>
          </div>
          <h2
            id="pdp-reviews-heading"
            className="font-headline-md text-xl text-on-background sm:text-2xl lg:text-3xl"
          >
            কাস্টমার ফিডব্যাক
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant sm:text-base">
            আমাদের প্রকৃত ক্রেতাদের সত্যিকারের অভিজ্ঞতা ও মতামত।
          </p>
        </div>

        {/* Action Button Area (top-right on desktop) */}
        <div className="shrink-0">
          {!authLoading && !isAuthenticated ? (
            <Link
              href={loginHref}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <MaterialIcon name="login" className="text-[18px]" />
              <span>রিভিউ দিতে লগইন করুন</span>
            </Link>
          ) : isAuthenticated && activeEligibility?.canReview ? (
            <Button
              type="button"
              variant={formOpen ? "outline" : "default"}
              onClick={handleOpenForm}
              className={cn(
                "h-10 w-full rounded-full px-5 font-semibold sm:w-auto",
                formOpen
                  ? "border-outline-variant text-on-surface"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <MaterialIcon
                name={formOpen ? "close" : "edit_square"}
                className="text-[18px]"
              />
              <span>{formOpen ? "ফর্ম বন্ধ করুন" : "রিভিউ লিখুন"}</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Inline Review Eligibility Status / Guest Banner / Review Submission Form */}
      <div className="mb-8 space-y-4">
        {!authLoading && !isAuthenticated ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-white/10">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MaterialIcon name="rate_review" className="text-[20px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-on-background">
                  আপনি কি এই পণ্যটি ব্যবহার করেছেন?
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
                  আপনার অ্যাকাউন্টে লগইন করে ভেরিফাইড ক্রেতা হিসেবে আপনার অভিজ্ঞতা
                  শেয়ার করুন।
                </p>
              </div>
            </div>
            <Link
              href={loginHref}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-card px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <MaterialIcon name="login" className="text-[16px]" />
              <span>রিভিউ দিতে লগইন করুন</span>
            </Link>
          </div>
        ) : null}

        {!authLoading && isAuthenticated && loadingEligibility ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant dark:border-white/10">
            <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>আপনার রিভিউ যোগ্যতা যাচাই করা হচ্ছে...</span>
          </div>
        ) : null}

        {!authLoading &&
        isAuthenticated &&
        !loadingEligibility &&
        activeEligibility &&
        !activeEligibility.canReview ? (
          <div
            role="status"
            className={cn(
              "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
              alreadyReviewed
                ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-100"
                : "border-outline-variant/30 bg-surface-container-low text-on-background dark:border-white/10",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  alreadyReviewed
                    ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                )}
              >
                <MaterialIcon
                  name={alreadyReviewed ? "verified" : "info"}
                  filled
                  className="text-[19px]"
                />
              </span>
              <div>
                <p className="text-sm font-semibold">{activeEligibility.reason}</p>
                <p className="mt-0.5 text-xs opacity-80">
                  {alreadyReviewed
                    ? "আপনার মূল্যবান মতামত আমাদের ও অন্যান্য ক্রেতাদের সাহায্য করছে।"
                    : "পণ্যটি অর্ডার ও কনফার্ম হওয়ার পর এই পেজে এসে সরাসরি ভেরিফাইড রিভিউ দিতে পারবেন।"}
                </p>
              </div>
            </div>

            {!alreadyReviewed ? (
              <Link
                href="/dashboard/purchases"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 bg-card px-3.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                <MaterialIcon name="shopping_bag" className="text-[15px]" />
                <span>আমার কেনা পণ্য দেখুন</span>
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Interactive Verified Review Form */}
        {!authLoading &&
        isAuthenticated &&
        activeEligibility?.canReview &&
        formOpen ? (
          <form
            ref={formRef}
            onSubmit={(e) => void handleSubmit(e)}
            className="rounded-2xl border border-primary/25 bg-card p-5 shadow-sm sm:p-6 dark:border-primary/30"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
              <div className="flex items-center gap-3">
                <CustomerAvatar
                  name={customer?.fullName}
                  avatarUrl={customer?.avatarUrl}
                  size="md"
                />
                <div>
                  <h3 className="text-base font-bold text-on-background">
                    আপনার ভেরিফাইড রিভিউ লিখুন
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {customer?.fullName || "ক্রেতা"} • ভেরিফাইড ক্রেতা হিসেবে
                    প্রকাশিত হবে
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                <MaterialIcon name="verified" filled className="text-[14px]" />
                <span>ভেরিফাইড অর্ডার</span>
              </span>
            </div>

            {formError ? (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <MaterialIcon
                  name="error"
                  className="mt-0.5 shrink-0 text-[16px]"
                />
                <span>{formError}</span>
              </div>
            ) : null}

            {/* Clickable 1-5 Star Selector */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold text-on-background">
                আপনার রেটিং নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-low px-2.5 py-1.5"
                  onMouseLeave={() => setHoveredRating(null)}
                  role="radiogroup"
                  aria-label="স্টার রেটিং"
                >
                  {([1, 2, 3, 4, 5] as const).map((star) => {
                    const active = star <= activeStarValue;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} স্টার — ${REVIEW_RATING_LABELS[star]}`}
                        onMouseEnter={() => setHoveredRating(star)}
                        onFocus={() => setHoveredRating(star)}
                        onBlur={() => setHoveredRating(null)}
                        onClick={() => setRating(star)}
                        className="cursor-pointer rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <MaterialIcon
                          name="star"
                          filled={active}
                          className={cn(
                            "text-[28px] transition-colors",
                            active
                              ? "text-tertiary"
                              : "text-outline-variant/60 hover:text-tertiary/60",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary/10 px-3 py-1 text-xs font-bold text-tertiary">
                  <span>{activeStarValue}.০ / ৫</span>
                  <span>•</span>
                  <span>{REVIEW_RATING_LABELS[activeStarValue]}</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="review-headline"
                    className="text-xs font-semibold text-on-background"
                  >
                    রিভিউ শিরোনাম (ঐচ্ছিক)
                  </label>
                  <span className="text-[11px] tabular-nums text-outline">
                    {headline.length}/160
                  </span>
                </div>
                <Input
                  id="review-headline"
                  type="text"
                  maxLength={160}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="যেমন: দারুণ কোয়ালিটি ও দ্রুত ডেলিভারি!"
                  className="h-10 rounded-xl"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="review-comment"
                    className="text-xs font-semibold text-on-background"
                  >
                    বিস্তারিত মতামত <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] tabular-nums text-outline">
                    {comment.length}/2000
                  </span>
                </div>
                <Textarea
                  id="review-comment"
                  rows={4}
                  maxLength={2000}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="পণ্যটির মান, ব্যবহারের অভিজ্ঞতা, প্যাকেজিং বা ডেলিভারি কেমন লেগেছে লিখুন..."
                  className="min-h-28 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setFormOpen(false);
                  setFormError(null);
                }}
                className="rounded-xl"
              >
                বাতিল করুন
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>জমা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <MaterialIcon name="send" className="text-[16px]" />
                    <span>রিভিউ জমা দিন</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Main Content: Error / Loading / Summary + Review Cards */}
      {reviewsError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
          <MaterialIcon
            name="cloud_off"
            className="text-[32px] text-rose-500"
          />
          <p className="mt-2 text-sm font-semibold text-rose-800 dark:text-rose-200">
            {reviewsError}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => triggerReload()}
            className="mt-4 rounded-xl"
          >
            <MaterialIcon name="refresh" className="text-[16px]" />
            <span>আবার চেষ্টা করুন</span>
          </Button>
        </div>
      ) : loadingReviews && !reviewPage ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
          <div className="h-72 animate-pulse rounded-2xl border border-outline-variant/25 bg-surface-container-low p-6" />
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-2xl border border-outline-variant/25 bg-surface-container-low p-6"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Rating Summary Card (5-to-1 Complete Breakdown) */}
          <aside className="h-fit rounded-2xl border border-outline-variant/30 bg-card p-5 sm:p-6 lg:p-7 dark:border-white/10">
            <div className="mb-6 text-center sm:mb-7">
              <div className="text-5xl font-bold leading-none tabular-nums text-on-background sm:text-6xl">
                {summary.totalReviews > 0
                  ? summary.averageRating.toFixed(1)
                  : "0.0"}
              </div>
              <div className="my-2.5 flex justify-center">
                <StarDisplay
                  value={summary.averageRating}
                  sizeClass="text-[22px]"
                />
              </div>
              <p className="text-xs font-medium text-outline">
                {summary.totalReviews > 0
                  ? `${summary.totalReviews} টি ভেরিফাইড রিভিউয়ের ভিত্তিতে`
                  : "এখনও কোনো রিভিউ জমা হয়নি"}
              </p>
            </div>

            <div className="space-y-3">
              {breakdown.map((row) => (
                <div
                  key={row.stars}
                  className="flex items-center gap-2.5 text-xs"
                >
                  <span className="inline-flex w-9 shrink-0 items-center gap-0.5 font-semibold tabular-nums text-on-surface">
                    <span>{row.stars}</span>
                    <MaterialIcon
                      name="star"
                      filled
                      className="text-[14px] text-tertiary"
                    />
                  </span>
                  <div className="flex-1">
                    <Progress value={row.percent} className="h-2" />
                  </div>
                  <span className="w-14 shrink-0 text-right tabular-nums text-outline">
                    {row.percent}% ({row.count})
                  </span>
                </div>
              ))}
            </div>
          </aside>

          {/* Reviews List & Pagination */}
          <div className="space-y-4 lg:col-span-2">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-12 text-center sm:px-10">
                <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MaterialIcon name="rate_review" className="text-[26px]" />
                </div>
                <h3 className="text-lg font-semibold text-on-background">
                  এখনও কোনো রিভিউ নেই
                </h3>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-on-surface-variant">
                  {product.status === "coming-soon"
                    ? "প্রোডাক্ট লঞ্চ হওয়ার পর এখানে ভেরিফাইড কাস্টমার রিভিউ যুক্ত হবে।"
                    : "প্রথম রিভিউটি আপনার হতে পারে — পণ্যটি অর্ডার করার পর আপনার অভিজ্ঞতা শেয়ার করুন।"}
                </p>
                {isAuthenticated && activeEligibility?.canReview && !formOpen ? (
                  <Button
                    type="button"
                    onClick={handleOpenForm}
                    className="mt-5 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <MaterialIcon name="edit_square" className="text-[17px]" />
                    <span>প্রথম রিভিউ লিখুন</span>
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "space-y-4 transition-opacity",
                    loadingReviews && "opacity-60",
                  )}
                >
                  {items.map((review) => {
                    const formattedDate = formatReviewDateBn(review.createdAt);
                    return (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-outline-variant/30 bg-card p-5 transition-shadow hover:shadow-xs sm:p-6 dark:border-white/10"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <CustomerAvatar
                              name={review.userName}
                              avatarUrl={review.userAvatar}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-sm font-bold text-on-background">
                                  {review.userName}
                                </h3>
                                {review.isVerifiedPurchase ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <MaterialIcon
                                      name="verified"
                                      filled
                                      className="text-[12px]"
                                    />
                                    <span>ভেরিফাইড ক্রেতা</span>
                                  </span>
                                ) : null}
                              </div>
                              {formattedDate ? (
                                <p className="mt-0.5 text-xs text-outline">
                                  {formattedDate}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <StarDisplay
                            value={review.rating}
                            sizeClass="text-[17px]"
                          />
                        </div>

                        {review.headline ? (
                          <h4 className="mb-1.5 text-sm font-bold text-on-background sm:text-base">
                            {review.headline}
                          </h4>
                        ) : null}

                        {review.comment ? (
                          <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-variant sm:text-[15px]">
                            {review.comment}
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 ? (
                  <nav
                    aria-label="রিভিউ পেজিনেশন"
                    className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 dark:border-white/10"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loadingReviews}
                      onClick={() => {
                        setLoadingReviews(true);
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className="rounded-xl"
                    >
                      <MaterialIcon name="chevron_left" className="text-[18px]" />
                      <span>আগের পাতা</span>
                    </Button>

                    <span className="text-xs font-semibold tabular-nums text-on-surface-variant">
                      পাতা {page} / {totalPages}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loadingReviews}
                      onClick={() => {
                        setLoadingReviews(true);
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className="rounded-xl"
                    >
                      <span>পরের পাতা</span>
                      <MaterialIcon
                        name="chevron_right"
                        className="text-[18px]"
                      />
                    </Button>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
