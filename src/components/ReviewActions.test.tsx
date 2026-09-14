import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewActions from "@/components/ReviewActions";

const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("@/components/ReviewForm", () => ({
  default: ({
    onCancel,
    onSuccess,
  }: {
    onCancel: () => void;
    onSuccess: () => void;
  }) => (
    <div>
      <h3>Edit your review</h3>
      <button type="button" onClick={onSuccess}>
        Save changes
      </button>
      <button type="button" onClick={onCancel}>
        Cancel edit
      </button>
    </div>
  ),
}));

describe("ReviewActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("smoothly exchanges the action buttons for the edit panel", () => {
    render(
      <ReviewActions
        reviewId="review-1"
        initialRating={5}
        initialComment="Excellent mouse."
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit review" }));

    const editPanel = screen
      .getByRole("heading", { name: "Edit your review" })
      .closest("[aria-hidden]");

    expect(editPanel).toHaveAttribute("aria-hidden", "false");
    expect(editPanel).toHaveClass("grid-rows-[1fr]", "opacity-100");
    expect(
      screen.getByText("Edit review", { selector: "button" }).closest("[aria-hidden]")
    ).toHaveClass("grid-rows-[0fr]", "opacity-0");

    fireEvent.click(screen.getByRole("button", { name: "Cancel edit" }));

    expect(editPanel).toHaveAttribute("aria-hidden", "true");
    expect(editPanel).toHaveClass("grid-rows-[0fr]", "opacity-0");
  });

  it("smoothly opens the delete confirmation and removes the review", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Review deleted." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(
      <ReviewActions
        reviewId="review-1"
        initialRating={5}
        initialComment="Excellent mouse."
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete review" }));

    const confirmation = screen.getByRole("group", {
      name: "Delete this review?",
    });
    const deletePanel = confirmation.closest("[aria-hidden]");

    expect(deletePanel).toHaveAttribute("aria-hidden", "false");
    expect(deletePanel).toHaveClass("grid-rows-[1fr]", "opacity-100");

    fireEvent.click(
      screen.getByRole("button", { name: "Yes, delete review" })
    );

    await waitFor(() => expect(refreshMock).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      "/api/reviews",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ reviewId: "review-1" }),
      })
    );
  });
});
