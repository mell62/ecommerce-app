-- Preserve historical orders while requiring each new checkout flow to supply
-- a stable idempotency key at the application boundary.
ALTER TABLE "Order" ADD COLUMN "checkoutIdempotencyKey" TEXT;

CREATE UNIQUE INDEX "Order_userId_checkoutIdempotencyKey_key"
ON "Order"("userId", "checkoutIdempotencyKey");
