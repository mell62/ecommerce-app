import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeleteProductButton from "@/components/DeleteProductButton";

const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

describe("DeleteProductButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("explains why an ordered product cannot be deleted", () => {
    render(
      <DeleteProductButton
        productId="product-1"
        productName="Gaming Mouse"
        canDelete={false}
      />
    );

    expect(
      screen.getByRole("button", { name: "Delete unavailable" })
    ).toBeDisabled();
    expect(screen.getByText("Preserved for order history.")).toBeVisible();
  });

  it("uses inline confirmation and allows cancellation", () => {
    render(
      <DeleteProductButton
        productId="product-1"
        productName="Gaming Mouse"
        canDelete
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Gaming Mouse" })
    );
    expect(
      screen.getByRole("group", {
        name: "Confirm deletion of Gaming Mouse",
      })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("group", {
        name: "Confirm deletion of Gaming Mouse",
      })
    ).not.toBeInTheDocument();
  });

  it("deletes the product and refreshes the inventory", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Gaming Mouse was deleted successfully.",
          productId: "product-1",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <DeleteProductButton
        productId="product-1"
        productName="Gaming Mouse"
        canDelete
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Gaming Mouse" })
    );

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/products?deleted=true");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/products/product-1", {
      method: "DELETE",
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("shows an inline API error without closing confirmation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Products included in customer orders cannot be deleted because their order history must be preserved.",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );
    render(
      <DeleteProductButton
        productId="product-1"
        productName="Gaming Mouse"
        canDelete
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Gaming Mouse" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Products included in customer orders cannot be deleted"
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <DeleteProductButton
        productId="product-1"
        productName="Gaming Mouse"
        canDelete
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Gaming Mouse" })
    );

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
