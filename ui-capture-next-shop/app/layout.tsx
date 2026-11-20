import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = { title: "Demo Shop" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="brand" data-testid="nav-home">
            Demo Shop
          </Link>
          <nav>
            <Link href="/products" data-testid="nav-products">
              Products
            </Link>
            <Link href="/cart" data-testid="nav-cart">
              Cart
            </Link>
            <Link href="/about" data-testid="nav-about">
              About
            </Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
