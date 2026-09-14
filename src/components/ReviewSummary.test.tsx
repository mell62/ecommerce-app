import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewSummary from "@/components/ReviewSummary";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("ReviewSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading state before rendering the generated summary", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewSummary productId="product-1" />);

    expect(
      screen.getByText("Preparing the customer review summary.")
    ).toBeInTheDocument();

    resolveRequest?.(
      jsonResponse({
        status: "ready",
        summary: "Customers praise its comfort and precise tracking.",
        reviewCount: 8,
        generatedAt: "2026-09-12T10:00:00.000Z",
      })
    );

    expect(
      await screen.findByText(
        "Customers praise its comfort and precise tracking."
      )
    ).toBeVisible();
    expect(screen.getByText(/AI-generated from 8 customer reviews/)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products/product-1/review-summary",
      { signal: expect.any(AbortSignal) }
    );
  });

  it("allows a summary with an unbroken word to wrap inside its card", async () => {
    const longSummary = "comfortable".repeat(100);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "ready",
          summary: longSummary,
          reviewCount: 4,
        })
      )
    );

    render(<ReviewSummary productId="product-1" />);

    expect(await screen.findByText(longSummary)).toHaveClass(
      "[overflow-wrap:anywhere]"
    );
  });

  it("explains when there are not enough reviews", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "not-enough-reviews",
          reviewCount: 1,
        })
      )
    );

    render(<ReviewSummary productId="product-1" />);

    expect(await screen.findByText("More feedback needed")).toBeVisible();
    expect(
      screen.getByText(/after at least two customers have reviewed/)
    ).toBeVisible();
  });

  it("handles a non-JSON failure and retries successfully", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("<!DOCTYPE html>", {
          status: 503,
          headers: { "Content-Type": "text/html" },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "ready",
          summary: "Customers value its comfortable shape.",
          reviewCount: 3,
          generatedAt: "2026-09-12T10:00:00.000Z",
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewSummary productId="product-1" />);

    expect(await screen.findByText("Summary unavailable")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText("Customers value its comfortable shape.")
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats an invalid success response as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: "ready" }))
    );

    render(<ReviewSummary productId="product-1" />);

    expect(await screen.findByText("Summary unavailable")).toBeVisible();
  });

  it("cancels its request when removed from the page", async () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, request: RequestInit) => {
        requestSignal = request.signal as AbortSignal;
        return new Promise<Response>(() => undefined);
      })
    );

    const { unmount } = render(<ReviewSummary productId="product-1" />);

    expect(requestSignal?.aborted).toBe(false);
    unmount();
    expect(requestSignal?.aborted).toBe(true);
  });

  it("has no detectable accessibility violations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: "ready",
          summary: "Customers praise its comfort and precise tracking.",
          reviewCount: 8,
          generatedAt: "2026-09-12T10:00:00.000Z",
        })
      )
    );

    const { container } = render(<ReviewSummary productId="product-1" />);

    await waitFor(() => {
      expect(screen.getByText(/AI-generated from 8 customer reviews/)).toBeVisible();
    });

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
