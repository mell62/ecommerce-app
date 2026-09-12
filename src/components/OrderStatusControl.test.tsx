import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderStatusControl from "@/components/OrderStatusControl";

const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

describe("OrderStatusControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("animates inline confirmation and restores focus after cancellation", async () => {
    render(
      <OrderStatusControl
        orderId="order-12345678"
        currentStatus="PROCESSING"
        isPaid
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark as shipped" }));

    expect(
      screen.getByRole("group", {
        name: "Confirm status update for order 12345678",
      })
    ).toBeVisible();
    expect(screen.getByText("Mark order #12345678 as shipped?")).toBeVisible();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Yes, mark as shipped" })
      ).toHaveFocus();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Mark as shipped" })
      ).toHaveFocus();
    });
  });

  it("updates status and refreshes the admin orders page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          order: {
            id: "order-12345678",
            status: "SHIPPED",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <OrderStatusControl
        orderId="order-12345678"
        currentStatus="PROCESSING"
        isPaid
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark as shipped" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Yes, mark as shipped" })
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/orders?updated=true");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/orders/order-12345678", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "SHIPPED" }),
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("does not offer fulfillment controls for unpaid or terminal orders", () => {
    const { rerender } = render(
      <OrderStatusControl
        orderId="order-12345678"
        currentStatus="PENDING"
        isPaid={false}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <OrderStatusControl
        orderId="order-12345678"
        currentStatus="DELIVERED"
        isPaid
      />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps confirmation open when the API rejects the update", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "The order changed while it was being updated. Refresh and try again.",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );
    render(
      <OrderStatusControl
        orderId="order-12345678"
        currentStatus="PROCESSING"
        isPaid
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark as shipped" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, mark as shipped" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The order changed while it was being updated"
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <OrderStatusControl
        orderId="order-12345678"
        currentStatus="PROCESSING"
        isPaid
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark as shipped" }));

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
