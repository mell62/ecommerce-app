"use client";

export default function AddToCartButton({ product }) {
  const isOutOfStock = product.stockCount === 0;

  const hasDiscount = product.discountPercent > 0;

  const finalPrice = hasDiscount
    ? Number(
        (
          product.price -
          (product.price * product.discountPercent) / 100
        ).toFixed(2)
      )
    : product.price;

  function handleClick() {
    const existing = JSON.parse(localStorage.getItem("cart")) || [];

    const found = existing.find((item) => item.id === product.id);

    if (found) {
      found.quantity += 1;
    } else {
      existing.push({
        ...product,
        price: finalPrice,
        originalPrice: product.price,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existing));

    window.dispatchEvent(new Event("cartUpdated"));

    alert("Added to cart!");
  }

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      className="mt-6 bg-black text-white px-6 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
