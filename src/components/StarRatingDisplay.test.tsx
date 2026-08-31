import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StarRatingDisplay from "@/components/StarRatingDisplay";

describe("StarRatingDisplay", () => {
  it("announces the rounded rating to assistive technology", () => {
    render(<StarRatingDisplay rating={4.4} />);

    expect(
      screen.getByRole("img", { name: "4 out of 5 stars" })
    ).toBeInTheDocument();
  });

  it("keeps the announced rating between zero and five", () => {
    const { rerender } = render(<StarRatingDisplay rating={8} />);

    expect(
      screen.getByRole("img", { name: "5 out of 5 stars" })
    ).toBeInTheDocument();

    rerender(<StarRatingDisplay rating={-2} />);

    expect(
      screen.getByRole("img", { name: "0 out of 5 stars" })
    ).toBeInTheDocument();
  });
});
