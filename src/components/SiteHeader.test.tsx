import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import SiteHeader from "@/components/SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function renderHeader(isAdmin = false) {
  return render(
    <CartProvider isAuthenticated={false}>
      <SiteHeader userName={null} isAdmin={isAdmin} />
    </CartProvider>
  );
}

describe("SiteHeader accessibility", () => {
  it("has no detectable violations when the mobile menu is closed", async () => {
    const { container } = renderHeader();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("has no detectable violations when the mobile menu is open", async () => {
    const { container } = renderHeader();

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" })
    );

    expect(
      screen.getByRole("button", { name: "Close navigation menu" })
    ).toHaveAttribute("aria-expanded", "true");

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});

describe("SiteHeader mobile navigation", () => {
  it("closes the menu when the user interacts outside the header", () => {
    renderHeader();

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" })
    );
    fireEvent.pointerDown(document.body);

    expect(
      screen.getByRole("button", { name: "Open navigation menu" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the menu open when the user interacts inside the header", () => {
    renderHeader();

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" })
    );
    fireEvent.pointerDown(
      screen.getByRole("navigation", { name: "Mobile primary navigation" })
    );

    expect(
      screen.getByRole("button", { name: "Close navigation menu" })
    ).toHaveAttribute("aria-expanded", "true");
  });
});

describe("SiteHeader admin navigation", () => {
  it("shows the admin destination to administrators", () => {
    renderHeader(true);

    expect(
      within(
        screen.getByRole("navigation", { name: "Primary navigation" })
      ).getByRole("link", { name: "Admin" })
    ).toHaveAttribute("href", "/admin");

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" })
    );

    expect(
      within(
        screen.getByRole("navigation", {
          name: "Mobile primary navigation",
        })
      ).getByRole("link", { name: "Admin" })
    ).toHaveAttribute("href", "/admin");
  });

  it("hides the admin destination from customers", () => {
    renderHeader();

    expect(
      screen.queryByRole("link", { name: "Admin" })
    ).not.toBeInTheDocument();
  });
});
