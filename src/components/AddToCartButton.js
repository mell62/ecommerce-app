"use client";

export default function AddToCartButton({ product }) {
  function handleClick() {
    const existing = JSON.parse(localStorage.getItem("cart")) || [];

    const found = existing.find((item) => item.id === product.id);

    if (found) {
      found.quantity += 1;
    } else {
      existing.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existing));

    alert("Added to cart!");
  }

  return (
    <button
      onClick={handleClick}
      className="mt-6 bg-black text-white px-6 py-3 rounded"
    >
      Add to Cart
    </button>
  );
}
