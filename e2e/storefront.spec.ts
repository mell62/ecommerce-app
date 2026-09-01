import { expect, test } from "@playwright/test";

test("loads the storefront and its primary shopping action", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Upgrade the way you work, play, and create",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Shop products", exact: true }),
  ).toHaveAttribute("href", "/products");
});
