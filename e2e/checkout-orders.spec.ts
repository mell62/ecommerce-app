import { expect, test } from "@playwright/test";
import { createTestCredentials, registerAndLogin } from "./helpers";

test("customer can create an order and continue to payment", async ({
  page,
}) => {
  const credentials = createTestCredentials("CheckoutOrders");
  await registerAndLogin(page, credentials);

  await page.route("**/api/checkout/session", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        checkoutUrl:
          "http://127.0.0.1:3100/orders?payment=success&session_id=cs_e2e_checkout",
      }),
    });
  });

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
  await page.getByLabel("Street address").fill("123 Technology Avenue");
  await page.getByLabel("City").fill("Austin");
  await page.getByLabel("State").fill("Texas");
  await page.getByLabel("ZIP code").fill("78701");
  await page.getByRole("button", { name: "Continue to payment" }).click();

  await expect(page).toHaveURL(
    /\/orders\?payment=success&session_id=cs_e2e_checkout$/,
  );
  await expect(page.getByRole("status")).toContainText(
    "Confirming your payment",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Your orders" }),
  ).toBeVisible();
  await expect(
    page.locator("article").first().getByText("Mechanical Keyboard", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator("article").first().getByRole("button", {
      name: "Complete payment",
    }),
  ).toBeVisible();
});
