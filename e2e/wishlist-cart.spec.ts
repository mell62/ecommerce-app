import { expect, test } from "@playwright/test";
import { createTestCredentials, registerAndLogin } from "./helpers";

test("customer can save a product and manage its cart quantity", async ({
  page,
}) => {
  const credentials = createTestCredentials("WishlistCart");
  await registerAndLogin(page, credentials);

  await page.goto("/products");
  await page.getByRole("link", { name: /Gaming Mouse/ }).first().click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Gaming Mouse" }),
  ).toBeVisible();

  const wishlistButton = page.getByRole("button", {
    name: "Add Gaming Mouse to wishlist",
  });
  await expect(wishlistButton).toBeEnabled();
  await wishlistButton.click();
  await expect(
    page.getByRole("button", { name: "Remove Gaming Mouse from wishlist" }),
  ).toBeVisible();

  await page.goto("/wishlist");
  await expect(page.getByText("Gaming Mouse", { exact: true })).toBeVisible();
  await expect(page.getByText("1 saved product", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.getByText("Added to cart", { exact: true })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("Gaming Mouse", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue to checkout" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Increase Gaming Mouse quantity" }).click();
  await expect(
    page.locator('span[aria-live="polite"]').filter({ hasText: "2" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Your cart is empty", { exact: true })).toBeVisible();

  await page.goto("/wishlist");
  await page.getByRole("button", { name: "Remove Gaming Mouse from wishlist" }).click();
  await expect(
    page.getByText("Your wishlist is empty", { exact: true }),
  ).toBeVisible();
});
