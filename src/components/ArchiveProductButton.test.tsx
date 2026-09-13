import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ArchiveProductButton from "@/components/ArchiveProductButton";

const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

describe("ArchiveProductButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    {
      isArchived: false,
      buttonName: "Archive Gaming Mouse",
      requestedState: true,
      destination: "/admin/products?archived=true",
    },
    {
      isArchived: true,
      buttonName: "Restore Gaming Mouse",
      requestedState: false,
      destination: "/admin/products?restored=true",
    },
  ])(
    "updates the archive state when using $buttonName",
    async ({ isArchived, buttonName, requestedState, destination }) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ product: { id: "product-1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
      vi.stubGlobal("fetch", fetchMock);
      render(
        <ArchiveProductButton
          productId="product-1"
          productName="Gaming Mouse"
          isArchived={isArchived}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: buttonName }));

      await waitFor(() => {
        expect(replaceMock).toHaveBeenCalledWith(destination);
      });
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products/product-1/archive",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isArchived: requestedState }),
        }
      );
      expect(refreshMock).toHaveBeenCalledOnce();
    }
  );

  it("shows an inline API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Product not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    render(
      <ArchiveProductButton
        productId="missing-product"
        productName="Gaming Mouse"
        isArchived={false}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Archive Gaming Mouse" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Product not found."
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <ArchiveProductButton
        productId="product-1"
        productName="Gaming Mouse"
        isArchived={false}
      />
    );

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
