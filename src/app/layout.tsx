import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import CartProvider from "@/components/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WishlistProvider from "@/components/WishlistProvider";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zeus Electronics",
    template: "%s | Zeus",
  },
  description:
    "Shop thoughtfully selected electronics and accessories for work, gaming, and everyday life.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WishlistProvider
          key={user?.id ?? "guest"}
          isAuthenticated={Boolean(user)}
        >
          <CartProvider
            key={user?.id ?? "guest"}
            isAuthenticated={Boolean(user)}
          >
            <Link
              href="#main-content"
              className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-brand-700 px-4 py-3 font-semibold text-white shadow-card focus:translate-y-0"
            >
              Skip to main content
            </Link>

            <SiteHeader userName={user?.name ?? null} />

            <main id="main-content" tabIndex={-1} className="flex-1">
              {children}
            </main>

            <SiteFooter />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
