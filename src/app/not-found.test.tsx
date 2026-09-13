import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import NotFound, { metadata } from "./not-found";

describe("NotFound", () => {
  it("offers clear recovery links without accessibility violations", async () => {
    const { container } = render(<NotFound />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "This page isn't connected",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products"
    );
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/"
    );

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("prevents missing pages from being indexed", () => {
    expect(metadata).toEqual({
      title: "Page not found",
      description: "The requested page could not be found on Zeus Electronics.",
      robots: {
        index: false,
        follow: false,
      },
    });
  });
});
