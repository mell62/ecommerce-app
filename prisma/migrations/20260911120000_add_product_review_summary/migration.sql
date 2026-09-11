CREATE TABLE "ProductReviewSummary" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReviewSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductReviewSummary_productId_key"
ON "ProductReviewSummary"("productId");

ALTER TABLE "ProductReviewSummary"
ADD CONSTRAINT "ProductReviewSummary_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
