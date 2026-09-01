import { expect, test } from "@playwright/test";
import { createTestCredentials, registerAndLogin } from "./helpers";

test("customer can place an order and see it in order history", async ({
  page,
}) => {
  const credentials = createTestCredentials("CheckoutOrders");
  await registerAndLogin(page, credentials);

  await page.goto("/products");
  await page.getByRole("link", { name: /Mechanical Keyboard/ }).first().click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Mechanical Keyboard" }),
  ).toBeVisible();

  const addToCartButton = page.getByRole("button", {
    name: "Add to cart",
    exact: true,
  });
  await expect(addToCartButton).toBeEnabled();
  await addToCartButton.click();
  await expect(page.getByText("Added to cart.", { exact: true })).toBeVisible();

  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { level: 1, name: "Checkout" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\?success=true$/);
  await expect(page.getByRole("status")).toContainText(
    "Order placed successfully",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Your orders" }),
  ).toBeVisible();
  await expect(page.getByText("Mechanical Keyboard", { exact: true })).toBeVisible();
});
