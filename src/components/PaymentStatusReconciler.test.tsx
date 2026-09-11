import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PaymentStatusReconciler from "@/components/PaymentStatusReconciler";

const refreshMock = vi.hoisted(() => vi.fn());
const routerMock = vi.hoisted(() => ({
  refresh: refreshMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

describe("PaymentStatusReconciler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refreshes the server page after Stripe confirms payment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ paymentStatus: "PAID" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PaymentStatusReconciler sessionId="cs_test_checkout" />);

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledOnce();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/checkout/session/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: "cs_test_checkout" }),
    });
  });

  it("offers another check when Stripe still reports pending", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ paymentStatus: "PENDING" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <PaymentStatusReconciler sessionId="cs_test_checkout" />
    );

    expect(
      await screen.findByText("Stripe still reports this payment as pending.")
    ).toBeVisible();
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Check again" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("allows retrying after verification cannot reach the server", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", fetchMock);

    render(<PaymentStatusReconciler sessionId="cs_test_checkout" />);

    expect(
      await screen.findByText("We could not check Stripe right now.")
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
