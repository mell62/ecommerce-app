import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import CartContents from "@/components/CartContents";
import CartProvider from "@/components/CartProvider";
import CheckoutSummarySkeleton from "@/components/CheckoutSummarySkeleton";
import ProductFilters from "@/components/ProductFilters";
import SiteFooter from "@/components/SiteFooter";
import WishlistContents from "@/components/WishlistContents";
import WishlistProvider from "@/components/WishlistProvider";
import OrdersError from "@/app/orders/error";
import OrdersLoading from "@/app/orders/loading";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shared accessibility states", () => {
  it("has no detectable violations in the site footer", async () => {
    const { container } = render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no detectable violations in the expanded product filters", async () => {
    const { container } = render(<ProductFilters />);

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));

    expect(
      screen.getByRole("group", { name: "Filter products" })
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no detectable violations in the logged-out cart state", async () => {
    const { container } = render(
      <CartProvider isAuthenticated={false}>
        <CartContents />
      </CartProvider>
    );

    expect(
      screen.getByRole("heading", { name: "Log in to view your cart" })
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no detectable violations in the logged-out wishlist state", async () => {
    const { container } = render(
      <CartProvider isAuthenticated={false}>
        <WishlistProvider isAuthenticated={false}>
          <WishlistContents />
        </WishlistProvider>
      </CartProvider>
    );

    expect(
      screen.getByRole("heading", { name: "Log in to view your wishlist" })
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no detectable violations in the checkout loading state", async () => {
    const { container } = render(<CheckoutSummarySkeleton />);

    expect(
      screen.getByRole("status", { name: "Loading checkout" })
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no detectable violations in the orders loading state", async () => {
    const { container } = render(<OrdersLoading />);

    expect(
      screen.getByRole("status", { name: "Loading orders" })
    ).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no detectable violations in the orders error state", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <OrdersError error={new Error("Database unavailable")} reset={vi.fn()} />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
