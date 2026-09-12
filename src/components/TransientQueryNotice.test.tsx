import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TransientQueryNotice from "@/components/TransientQueryNotice";

describe("TransientQueryNotice", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("keeps the notice visible while removing its one-time URL trigger", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin/products?created=true&view=inventory#products"
    );

    render(
      <TransientQueryNotice queryParameters={["created"]}>
        <p role="status">Product created successfully.</p>
      </TransientQueryNotice>
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Product created successfully."
    );
    await waitFor(() => {
      expect(window.location.href).toBe(
        "http://localhost:3000/admin/products?view=inventory#products"
      );
    });
  });

  it("removes all supplied payment parameters", async () => {
    window.history.replaceState(
      {},
      "",
      "/orders?payment=success&session_id=cs_test&source=account"
    );

    render(
      <TransientQueryNotice
        queryParameters={["payment", "session_id", "order_id"]}
      >
        <p>Payment received</p>
      </TransientQueryNotice>
    );

    await waitFor(() => {
      expect(window.location.href).toBe(
        "http://localhost:3000/orders?source=account"
      );
    });
  });
});
