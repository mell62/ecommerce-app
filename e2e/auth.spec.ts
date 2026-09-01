import { expect, test } from "@playwright/test";
import { createTestCredentials } from "./helpers";

test("customer can register, log out, and log back in", async ({ page }) => {
  const credentials = createTestCredentials("Auth");

  await page.goto("/register");
  await page.getByLabel("Name").fill(credentials.name);
  await page.getByLabel("Email address").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(`Hello, ${credentials.name}`).first()).toBeVisible();

  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email address").fill(credentials.email);
  await page.locator('input[name="password"]').fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator("#login-error")).toContainText(
    "Invalid email or password.",
  );

  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(`Hello, ${credentials.name}`).first()).toBeVisible();
});

test("protected orders page sends logged-out customers to login", async ({
  page,
}) => {
  await page.goto("/orders");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Return to your Zeus setup." }),
  ).toBeVisible();
});
