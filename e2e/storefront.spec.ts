import { expect, test } from "@playwright/test";

test("customer can discover products through catalog controls", async ({
  page,
}) => {
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

  await page.getByRole("link", { name: "Shop products", exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.waitForTimeout(500);
  await expect(
    page.getByRole("heading", { level: 1, name: "Shop all products" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Accessories", exact: true }).click();
  await expect(page).toHaveURL(/category=Accessories/);
  await page.waitForTimeout(500);
  await expect(
    page.getByRole("heading", { level: 1, name: "Accessories" }),
  ).toBeVisible();

  const filtersButton = page.getByRole("button", { name: "Filters", exact: true });
  await filtersButton.click({ force: true });
  await expect(filtersButton).toHaveAttribute("aria-expanded", "true");
  const filterPanel = page.locator("#product-filter-panel");
  await expect(filterPanel).toBeVisible();
  await filterPanel.getByLabel("Search").fill("mouse");
  await filterPanel.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/search=mouse/);
  await expect(page.getByText("Gaming Mouse", { exact: true })).toBeVisible();

  await page.locator("#product-sort").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);

  await page.getByRole("link", { name: /Gaming Mouse/ }).first().click();
  await expect(page).toHaveURL(/\/products\/[^/]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Gaming Mouse" }),
  ).toBeVisible();
});

test("customer can use the mobile navigation menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(500);

  const menuButton = page.locator('button[aria-controls="mobile-navigation"]');
  await menuButton.click({ force: true });
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile primary navigation",
  });
  await expect(mobileNavigation).toBeVisible();

  await mobileNavigation
    .getByRole("link", { name: "Products", exact: true })
    .click();
  await expect(page).toHaveURL(/\/products$/);
});
