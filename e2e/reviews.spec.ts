import { expect, test } from "@playwright/test";
import { createTestCredentials, registerAndLogin } from "./helpers";

test("customer can create, edit, and delete a product review", async ({
  page,
}) => {
  const credentials = createTestCredentials("Reviews");
  const originalComment = `E2E review ${Date.now()} is comfortable and responsive.`;
  const updatedComment = `Updated E2E review ${Date.now()} feels even better.`;

  await registerAndLogin(page, credentials);
  await page.goto("/products");
  await page.getByRole("link", { name: /Gaming Mouse/ }).first().click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Gaming Mouse" }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { level: 2, name: "Leave a review" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "4 stars" }).check({ force: true });
  await page.getByLabel("Your review").fill(originalComment);
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText(originalComment, { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Your review is published", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit review" }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: "Edit your review" }),
  ).toBeVisible();
  const editForm = page.getByRole("form", { name: "Edit your review" });
  await editForm.getByRole("textbox", { name: "Your review" }).fill(updatedComment);
  await editForm.getByRole("radio", { name: "5 stars" }).check({ force: true });
  await editForm.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Review updated successfully.")).toBeVisible();
  await expect(page.getByText(updatedComment, { exact: true })).toBeVisible();
  await expect(page.getByText(originalComment, { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete review" }).click();
  await expect(page.getByText("Delete this review?", { exact: true })).toBeVisible();
  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/reviews") &&
      response.request().method() === "DELETE",
  );
  await page.getByRole("button", { name: "Yes, delete review" }).click();
  expect((await deleteResponsePromise).status()).toBe(200);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(updatedComment, { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 2, name: "Leave a review" }),
  ).toBeVisible();
});
