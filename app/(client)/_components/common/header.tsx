import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Container } from "./container";
import { MaterialIcon } from "./material-icon";
import { navLinks, SITE_NAME } from "../../_data/home";

const LOGO_SRC = "/images/common/logo.png";

export default function Header() {
  return (
    <header>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-200/50 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-neutral-800/50 dark:bg-slate-900/80">
        <Container className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link
              href="/"
              className="relative block h-10 w-[min(100%,11rem)] shrink-0 transition-opacity hover:opacity-90"
              aria-label={SITE_NAME}
            >
              <Image
                src={LOGO_SRC}
                alt=""
                fill
                priority
                className="object-contain object-left"
                sizes="(max-width: 768px) 140px, 176px"
              />
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.active
                      ? "border-b-2 border-emerald-900 pb-1 font-medium tracking-tight text-emerald-900 dark:border-emerald-400 dark:text-emerald-400"
                      : "font-medium tracking-tight text-neutral-600 transition-all duration-300 hover:text-emerald-800 dark:text-neutral-400 dark:hover:text-emerald-200"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden min-w-0 shrink lg:block">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[20px] text-outline"
              />
              <Input
                placeholder="Search curated collections..."
                className="h-10 w-64 rounded-full border-0 bg-surface-container-low py-2 pr-4 pl-10 font-label-md shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon-lg"
                className="shrink-0 scale-95 text-primary hover:opacity-80 active:scale-90 [&_.material-symbols-outlined]:text-[28px]"
                aria-label="Shopping cart"
              >
                <MaterialIcon name="shopping_cart" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                className="shrink-0 scale-95 text-primary hover:opacity-80 active:scale-90 [&_.material-symbols-outlined]:text-[28px]"
                aria-label="Account"
              >
                <MaterialIcon name="account_circle" />
              </Button>
            </div>
          </div>
        </Container>
      </nav>
    </header>
  );
}
