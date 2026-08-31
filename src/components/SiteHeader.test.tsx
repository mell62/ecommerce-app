import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import CartProvider from "@/components/CartProvider";
import SiteHeader from "@/components/SiteHeader";

function renderHeader() {
  return render(
    <CartProvider isAuthenticated={false}>
      <SiteHeader userName={null} />
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
