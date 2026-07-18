"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { flashSale } from "../../_data/home/home";

export function FlashSaleSection() {
  // Example: 5 hours countdown
  const SALE_DURATION = 8 * 60 * 60;

  const [timeLeft, setTimeLeft] = useState(SALE_DURATION);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");

  const minutes = String(
    Math.floor((timeLeft % 3600) / 60),
  ).padStart(2, "0");

  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <section className="py-xl">
      <Container className="px-8">
        <div className="flex flex-col items-center overflow-hidden rounded-[2rem] bg-linear-to-br from-[#062f2c] to-primary md:flex-row">
          <div className="flex-1 p-12 md:p-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="size-3 animate-pulse rounded-full bg-warm-gold" />

              <span className="font-label-md tracking-[0.3em] text-white uppercase">
                {flashSale.badge}
              </span>
            </div>

            <h2 className="mb-8 font-display-xl text-white">
              {flashSale.titleLines[0]}
              <br />
              {flashSale.titleLines[1]}
            </h2>

            {/* Countdown */}
            <div className="mb-12 flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{hours}</p>

                <p className="text-xs font-label-md text-white/60 uppercase">
                  ঘণ্টা
                </p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-white">{minutes}</p>

                <p className="text-xs font-label-md text-white/60 uppercase">
                  মিনিট
                </p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-white">{seconds}</p>

                <p className="text-xs font-label-md text-white/60 uppercase">
                  সেকেন্ড
                </p>
              </div>
            </div>

            <Link
              href={flashSale.ctaHref}
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-white px-12 py-5 font-label-md text-primary uppercase tracking-widest transition-all duration-300",
                "hover:bg-warm-gold hover:text-white active:scale-95",
              )}
            >
              {flashSale.cta}
            </Link>
          </div>

          <div className="h-full min-h-[400px] w-full flex-1">
            <Image
              src={flashSale.imageSrc}
              alt={flashSale.imageAlt}
              width={1200}
              height={800}
              className="h-full min-h-[400px] w-full object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}