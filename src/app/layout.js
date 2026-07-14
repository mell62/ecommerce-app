import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import CartCounter from "@/components/CartCounter";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "E-Commerce Store",
  description: "My E-Commerce App",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b p-4">
          <div className="max-w-6xl mx-auto flex justify-between">
            <Link href="/" className="text-xl font-bold">
              Store
            </Link>

            <div className="flex gap-6">
              <Link href="/products">Products</Link>
              <Link href="/cart">
                Cart <CartCounter />
              </Link>
              <Link href="/orders">Orders</Link>
              <Link href="/wishlist">Wishlist</Link>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm">Hello, {user.name}</span>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex gap-4">
                  <Link href="/login">Log In</Link>
                  <Link href="/register">Register</Link>
                </div>
              )}
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
