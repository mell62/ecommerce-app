import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminProductForm from "@/components/AdminProductForm";

const pushMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

function fillRequiredFields(): void {
  fireEvent.change(screen.getByLabelText("Product name"), {
    target: { value: "Wireless Headphones" },
  });
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Comfortable noise-cancelling headphones." },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "Audio" },
  });
  fireEvent.change(screen.getByLabelText("Image URL"), {
    target: {
      value:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    },
  });
  fireEvent.change(screen.getByLabelText("Price"), {
    target: { value: "149.99" },
  });
  fireEvent.change(screen.getByLabelText("Stock count"), {
    target: { value: "18" },
  });
  fireEvent.change(screen.getByLabelText("Discount percent"), {
    target: { value: "10" },
  });
}

describe("AdminProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits normalized numeric values and returns to inventory", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ product: { id: "product-1" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByLabelText("Featured product"));

    fireEvent.submit(screen.getByRole("form", { name: "Create product" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products?created=true");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Wireless Headphones",
        description: "Comfortable noise-cancelling headphones.",
        category: "Audio",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        price: 149.99,
        stockCount: 18,
        discountPercent: 10,
        isFeatured: true,
        isNew: false,
        isBestSeller: false,
      }),
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("places server validation feedback beside its field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Enter valid product details.",
            fieldErrors: {
              price: "Enter a price greater than zero.",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );
    render(<AdminProductForm />);

    fireEvent.submit(screen.getByRole("form", { name: "Create product" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter valid product details."
    );
    expect(screen.getByLabelText("Price")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByText("Enter a price greater than zero.")).toBeVisible();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<AdminProductForm />);

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
