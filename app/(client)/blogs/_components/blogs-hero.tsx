import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";

export function BlogsHero({
  postCount,
  className,
}: {
  postCount: number;
  className?: string;
}) {
  return (
    <section className={cn("w-full pt-6 pb-2 sm:pt-8 sm:pb-4 lg:pt-10", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl sm:rounded-[1.75rem]",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
          )}
        >
          {/* Atmosphere */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_0%_0%,rgba(43,192,181,0.35),transparent_55%),radial-gradient(ellipse_50%_60%_at_100%_100%,rgba(245,179,1,0.12),transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -bottom-20 size-72 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.03))] lg:block"
          />

          <div className="relative z-10 grid grid-cols-1 gap-8 px-5 py-10 sm:gap-10 sm:px-8 sm:py-12 md:px-12 md:py-14 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-8">
              <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.18em] text-primary-fixed/90 uppercase sm:text-xs">
                <span className="h-px w-8 bg-warm-gold/80" aria-hidden />
                ইমপ্লেসিয়া মার্ট ব্লগ
              </p>
              <h1 className="max-w-xl text-3xl leading-[1.15] font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                গ্যাজেট ও ফ্যাশন
                <span className="mt-1 block text-white/55">নিয়ে স্পষ্ট গাইড</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
                বায়িং গাইড থেকে কাস্টম ড্রেস টিপস — সিদ্ধান্ত সহজ করতে বাংলায় লেখা
                প্রফেশনাল আর্টিকেল।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 lg:col-span-4 lg:justify-end lg:border-t-0 lg:pt-0">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl">
                  {String(postCount).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs font-medium tracking-wide text-white/50 uppercase">
                  আর্টিকেল
                </p>
              </div>
              <div className="hidden h-10 w-px bg-white/15 sm:block" aria-hidden />
              <div>
                <p className="text-sm font-medium text-white/85">গ্যাজেট · ফ্যাশন</p>
                <p className="mt-1 text-xs text-white/45">রিভিউ · গাইড · টিপস</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
