"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ productId }) {
  const router = useRouter();

  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!comment.trim()) {
      alert("Please enter a review comment.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating: Number(rating),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit review.");
        return;
      }

      setRating("5");
      setComment("");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 space-y-4 border rounded p-4"
    >
      <h2 className="text-2xl font-bold">Leave a Review</h2>

      <select
        value={rating}
        onChange={(event) => setRating(event.target.value)}
        className="w-full border rounded px-4 py-2"
      >
        <option value="5">5 stars</option>
        <option value="4">4 stars</option>
        <option value="3">3 stars</option>
        <option value="2">2 stars</option>
        <option value="1">1 star</option>
      </select>

      <textarea
        placeholder="Write your review..."
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="w-full border rounded px-4 py-2"
        rows="4"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}
