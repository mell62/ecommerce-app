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
      value: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
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
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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

  it("prefills and updates an existing product", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ product: { id: "product-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AdminProductForm
        product={{
          id: "product-1",
          name: "Gaming Mouse",
          description: "A precise wireless gaming mouse.",
          category: "Accessories",
          imageUrl: "/mouse.png",
          price: 59.99,
          stockCount: 8,
          discountPercent: 15,
          isFeatured: true,
          isNew: false,
          isBestSeller: true,
        }}
      />
    );

    expect(screen.getByLabelText("Product name")).toHaveValue("Gaming Mouse");
    expect(screen.getByLabelText("Price")).toHaveValue(59.99);
    expect(screen.getByLabelText("Featured product")).toBeChecked();
    fireEvent.change(screen.getByLabelText("Stock count"), {
      target: { value: "20" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Edit product" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products?updated=true");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/products/product-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Gaming Mouse",
          description: "A precise wireless gaming mouse.",
          category: "Accessories",
          imageUrl: "/mouse.png",
          price: 59.99,
          stockCount: 20,
          discountPercent: 15,
          isFeatured: true,
          isNew: false,
          isBestSeller: true,
        }),
      })
    );
  });

  it("previews a supported product image and reports load failures", () => {
    render(<AdminProductForm />);

    expect(
      screen.getByText("Enter an image path to preview it here.")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Product name"), {
      target: { value: "Wireless Headphones" },
    });
    fireEvent.change(screen.getByLabelText("Image URL"), {
      target: { value: "/products/headphones.png" },
    });

    const preview = screen.getByRole("img", {
      name: "Preview of Wireless Headphones",
    });

    expect(preview).toHaveAttribute(
      "src",
      expect.stringContaining("%2Fproducts%2Fheadphones.png")
    );

    fireEvent.error(preview);

    expect(
      screen.getByText(
        "The image could not be loaded. Check the path and try again."
      )
    ).toBeInTheDocument();
  });

  it("does not render unsupported image sources", () => {
    render(<AdminProductForm />);

    fireEvent.change(screen.getByLabelText("Image URL"), {
      target: { value: "http://example.com/product.png" },
    });

    expect(
      screen.getByText("This image source is not supported.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uploads a selected image and fills its public URL", async () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/headphones.webp";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ imageUrl }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductForm />);
    const image = new File(["image"], "headphones.webp", {
      type: "image/webp",
    });

    fireEvent.change(screen.getByLabelText("Upload image"), {
      target: {
        files: [image],
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Image URL")).toHaveValue(imageUrl);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/product-images", {
      method: "POST",
      body: expect.any(FormData),
    });
    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;
    const requestBody = requestOptions.body as FormData;

    expect(requestBody.get("image")).toBe(image);
    expect(requestOptions.headers).toBeUndefined();
    expect(
      screen.getByText("headphones.webp uploaded successfully.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Product image preview" })
    ).toBeInTheDocument();
  });

  it("cleans up a previous unsaved upload when another image is uploaded", async () => {
    const firstImageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/first.webp";
    const secondImageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/second.webp";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ imageUrl: firstImageUrl }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ imageUrl: secondImageUrl }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Product image deleted successfully." }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductForm />);
    const uploadInput = screen.getByLabelText("Upload image");

    fireEvent.change(uploadInput, {
      target: {
        files: [new File(["first"], "first.webp", { type: "image/webp" })],
      },
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Image URL")).toHaveValue(firstImageUrl);
    });

    fireEvent.change(uploadInput, {
      target: {
        files: [new File(["second"], "second.webp", { type: "image/webp" })],
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Image URL")).toHaveValue(secondImageUrl);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/admin/product-images", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: firstImageUrl }),
    });
  });

  it("removes an unsaved managed image before cancelling", async () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/temporary.webp";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ imageUrl }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Product image deleted successfully." }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductForm />);

    fireEvent.change(screen.getByLabelText("Upload image"), {
      target: {
        files: [
          new File(["temporary"], "temporary.webp", { type: "image/webp" }),
        ],
      },
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Image URL")).toHaveValue(imageUrl);
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products");
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/product-images", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });
  });

  it("keeps an existing product image when cancelling an edit", () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/existing.webp";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AdminProductForm
        product={{
          id: "product-1",
          name: "Gaming Mouse",
          description: "A precise wireless gaming mouse.",
          category: "Accessories",
          imageUrl,
          price: 59.99,
          stockCount: 8,
          discountPercent: 15,
          isFeatured: true,
          isNew: false,
          isBestSeller: true,
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/admin/products");
  });

  it("rejects an unsupported selected file before uploading", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductForm />);

    fireEvent.change(screen.getByLabelText("Upload image"), {
      target: {
        files: [
          new File(["vector"], "product.svg", { type: "image/svg+xml" }),
        ],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Use a JPEG, PNG, or WebP image."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<AdminProductForm />);

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
