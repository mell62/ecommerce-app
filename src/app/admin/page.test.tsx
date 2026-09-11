import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import AdminPage from "@/app/admin/page";

describe("AdminPage", () => {
  it("introduces the protected workspace without accessibility violations", async () => {
    const { container } = render(<AdminPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Admin dashboard" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Products & Inventory",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Orders" })
    ).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
