"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartCounter from "@/components/CartCounter";
import LogoutButton from "@/components/LogoutButton";

type SiteHeaderProps = Readonly<{
  userName: string | null;
}>;

const navigationItems = [
  {
    href: "/products",
    label: "Products",
  },
  {
    href: "/cart",
    label: "Cart",
  },
  {
    href: "/orders",
    label: "Orders",
  },
  {
    href: "/wishlist",
    label: "Wishlist",
  },
];

const navigationLinkClass =
  "flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-foreground hover:bg-brand-50 hover:text-brand-700";

export default function SiteHeader({ userName }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  function closeMenu(): void {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-md font-display text-xl font-bold tracking-tight text-foreground"
          onClick={closeMenu}
        >
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            sizes="36px"
            className="size-9 object-contain"
          />
          <span>Zeus</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navigationLinkClass}
            >
              {item.label}
              {item.href === "/cart" && (
                <span className="ml-1">
                  <CartCounter />
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {userName ? (
            <>
              <span className="max-w-40 truncate text-sm text-muted">
                Hello, {userName}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-surface-muted"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex min-h-11 items-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => setIsMenuOpen((open) => !open)}
          className="grid size-11 place-items-center rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted lg:hidden"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {isMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-border bg-surface px-4 py-4 shadow-card lg:hidden"
        >
          <nav
            aria-label="Mobile primary navigation"
            className="mx-auto flex max-w-7xl flex-col gap-1"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={navigationLinkClass}
              >
                {item.label}
                {item.href === "/cart" && (
                  <span className="ml-1">
                    <CartCounter />
                  </span>
                )}
              </Link>
            ))}

            <div className="mt-3 border-t border-border pt-3">
              {userName ? (
                <div className="flex flex-col gap-2">
                  <p className="px-3 text-sm text-muted">Hello, {userName}</p>
                  <LogoutButton />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-surface-muted"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-center text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
