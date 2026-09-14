import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReviewList from "@/components/ReviewList";

describe("ReviewList", () => {
  it("allows an unbroken review comment to wrap inside its card", () => {
    const longComment = "excellent".repeat(125);

    render(
      <ReviewList
        reviews={[
          {
            id: "review-1",
            userId: "customer-1",
            productId: "product-1",
            name: "Watson",
            rating: 5,
            comment: longComment,
            createdAt: new Date("2026-09-14T10:00:00.000Z"),
          },
        ]}
      />
    );

    const comment = screen.getByText(longComment);

    expect(comment).toHaveClass("[overflow-wrap:anywhere]");
    expect(comment.closest("article")).toHaveClass("min-w-0");
  });
});
