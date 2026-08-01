const REVIEW_PLACEHOLDERS = [
  "What stood out to you?",
  "How did this product fit into your setup?",
  "What did you like most about using it?",
  "How was the build quality and performance?",
  "Would you recommend this product to others?",
  "How does it compare with what you used before?",
  "What should another customer know before buying?",
  "How has your experience been so far?",
] as const;

export function getRandomReviewPlaceholder(): string {
  const randomIndex = Math.floor(Math.random() * REVIEW_PLACEHOLDERS.length);

  return REVIEW_PLACEHOLDERS[randomIndex];
}
