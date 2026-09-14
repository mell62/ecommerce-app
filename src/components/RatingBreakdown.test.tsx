import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import RatingBreakdown from "./RatingBreakdown";

describe("RatingBreakdown", () => {
  it("shows exact counts including zero counts accessibly", async () => {
    const { container } = render(
      <RatingBreakdown
        reviews={[{ rating: 5 }, { rating: 5 }, { rating: 1 }]}
      />
    );
    expect(screen.getByText("Based on 3 reviews")).toBeVisible();
    expect(screen.getByText("5 stars").parentElement).toHaveTextContent(
      "2 reviews"
    );
    expect(screen.getByText("4 stars").parentElement).toHaveTextContent(
      "0 reviews"
    );
    expect(screen.getByText("1 star").parentElement).toHaveTextContent(
      "1 review"
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
  it("handles no reviews without invalid percentages", () => {
    const { container } = render(<RatingBreakdown reviews={[]} />);
    expect(screen.getByText("Based on 0 reviews")).toBeVisible();
    expect(container.innerHTML).not.toContain("NaN");
  });
});
