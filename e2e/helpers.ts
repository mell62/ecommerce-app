import { expect, type Page } from "@playwright/test";

export type TestCredentials = {
  name: string;
  email: string;
  password: string;
};

export function createTestCredentials(label: string): TestCredentials {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `E2E ${label}`,
    email: `e2e-${label.toLowerCase()}-${suffix}@example.com`,
    password: "PlaywrightPass123!",
  };
}

export async function registerAndLogin(
  page: Page,
  credentials: TestCredentials,
): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Name").fill(credentials.name);
  await page.getByLabel("Email address").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(`Hello, ${credentials.name}`).first()).toBeVisible();
}
